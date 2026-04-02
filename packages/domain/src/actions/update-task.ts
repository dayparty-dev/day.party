import type { Task, TaskBounty, TaskEssentiality, TaskStatus } from '@dayparty/core';
import { mergeFocusForStatusTransition } from '../focus-session';
import type { LedgerRepository } from '../interfaces/ledger-repository';
import type { TaskRepository } from '../interfaces/task-repository';
import type { TagRepository } from '../interfaces/tag-repository';

export type UpdateTaskInput = Partial<{
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  tagKey: string | null;
  scheduledDate: string;
  isComplete: boolean;
  estimatedMinutes: number;
  essentiality: TaskEssentiality;
  status: TaskStatus;
  deferredToDate: string | null;
  /** Empty string clears stored notes (P3). */
  notesMarkdown: string;
  /** `null` clears stored bounty (P4). */
  bounty: TaskBounty | null;
}>;

function mergeLifecycleFields(
  task: Task,
  input: UpdateTaskInput,
): Pick<Task, 'isComplete' | 'status' | 'deferredToDate'> {
  let isComplete = task.isComplete;
  let status = task.status;
  let deferredToDate = task.deferredToDate;

  if ('deferredToDate' in input) {
    deferredToDate = input.deferredToDate ?? undefined;
  }

  if (input.status !== undefined) {
    status = input.status;
    if (status !== 'done') {
      isComplete = false;
    }
  }

  if (input.isComplete !== undefined) {
    isComplete = input.isComplete;
    if (!isComplete && (task.status === 'done' || status === 'done')) {
      status = 'planned';
      deferredToDate = undefined;
    }
  }

  if (isComplete) {
    status = 'done';
    deferredToDate = undefined;
  } else if (status === 'done') {
    isComplete = true;
    deferredToDate = undefined;
  } else {
    if (status === 'skipped' || status === 'planned' || status === 'in_progress') {
      deferredToDate = undefined;
    }
    if (status === 'deferred' && !deferredToDate) {
      throw new Error('deferredToDate is required when status is deferred');
    }
  }

  return { isComplete, status, deferredToDate };
}

export function makeUpdateTaskAction(taskRepo: TaskRepository, tagRepo: TagRepository, ledgerRepo: LedgerRepository) {
  return async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const task = await taskRepo.findById(id);
    if (!task) {
      throw new Error(`Task "${id}" not found`);
    }

    if (input.tagKey !== undefined && input.tagKey !== null) {
      const tag = await tagRepo.findByKey(task.userId, input.tagKey);
      if (!tag) {
        throw new Error(`Tag with key "${input.tagKey}" not found`);
      }
    }

    const touchesLifecycle = input.isComplete !== undefined || input.status !== undefined || 'deferredToDate' in input;
    const wasIncomplete = !task.isComplete;

    const fields: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>> = {};
    if (input.title !== undefined) fields.title = input.title;
    if (input.size !== undefined) fields.size = input.size;
    if ('tagKey' in input) fields.tagKey = input.tagKey ?? undefined;
    if (input.scheduledDate !== undefined) fields.scheduledDate = input.scheduledDate;
    if (input.estimatedMinutes !== undefined) fields.estimatedMinutes = input.estimatedMinutes;
    if (input.essentiality !== undefined) fields.essentiality = input.essentiality;
    if (input.notesMarkdown !== undefined) fields.notesMarkdown = input.notesMarkdown;
    if ('bounty' in input) {
      fields.bounty = input.bounty === null ? undefined : input.bounty;
    }

    if (touchesLifecycle) {
      const next = mergeLifecycleFields(task, input);
      fields.isComplete = next.isComplete;
      fields.status = next.status;
      fields.deferredToDate = next.deferredToDate;
      Object.assign(fields, mergeFocusForStatusTransition(task, next.status));
    }

    const updated = await taskRepo.update(id, fields);
    if (!updated) {
      throw new Error(`Task "${id}" not found after update`);
    }

    if (touchesLifecycle && wasIncomplete && updated.isComplete && updated.bounty && updated.bounty.amount > 0) {
      const correlation = `task-bounty:${task.id}`;
      const existing = await ledgerRepo.findByCorrelation(task.userId, correlation);
      if (!existing) {
        await ledgerRepo.insert({
          userId: task.userId,
          amount: updated.bounty.amount,
          reason: 'task_completion',
          correlation,
        });
      }
    }

    return updated;
  };
}
