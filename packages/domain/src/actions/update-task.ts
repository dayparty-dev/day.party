import type { Task, TaskBounty, TaskEssentiality, TaskStatus } from '@dayparty/core';
import { mergeFocusForStatusTransition } from '../focus-session';
import type { LedgerRepository } from '../interfaces/ledger-repository';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
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

function bountySummary(b: Task['bounty']): Record<string, unknown> | null {
  if (!b) return null;
  return {
    amount: b.amount,
    ...(b.tagKeys?.length ? { tagKeys: b.tagKeys } : {}),
    ...(b.highResistance ? { highResistance: true } : {}),
  };
}

function buildTaskUpdateHistoryPayload(
  before: Task,
  after: Task,
  input: UpdateTaskInput,
): Record<string, unknown> | null {
  const changes: Record<string, unknown> = {};

  if (input.title !== undefined && input.title !== before.title) {
    changes.title = { from: before.title, to: after.title };
  }
  if (input.size !== undefined && input.size !== before.size) {
    changes.size = { from: before.size, to: after.size };
  }
  if ('tagKey' in input) {
    const from = before.tagKey ?? null;
    const to = after.tagKey ?? null;
    if (from !== to) changes.tagKey = { from, to };
  }
  if (input.scheduledDate !== undefined && input.scheduledDate !== before.scheduledDate) {
    changes.scheduledDate = { from: before.scheduledDate, to: after.scheduledDate };
  }
  if (input.estimatedMinutes !== undefined && input.estimatedMinutes !== before.estimatedMinutes) {
    changes.estimatedMinutes = { from: before.estimatedMinutes, to: after.estimatedMinutes };
  }
  if (input.essentiality !== undefined && input.essentiality !== before.essentiality) {
    changes.essentiality = { from: before.essentiality, to: after.essentiality };
  }
  if ('notesMarkdown' in input) {
    const prev = before.notesMarkdown ?? '';
    const next = after.notesMarkdown ?? '';
    if (prev !== next) {
      changes.notesMarkdown = { changed: true };
    }
  }
  if ('bounty' in input) {
    const from = bountySummary(before.bounty);
    const to = bountySummary(after.bounty);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.bounty = { from, to };
    }
  }
  if (input.isComplete !== undefined || input.status !== undefined || 'deferredToDate' in input) {
    if (before.status !== after.status) {
      changes.status = { from: before.status, to: after.status };
    }
    if (before.isComplete !== after.isComplete) {
      changes.isComplete = { from: before.isComplete, to: after.isComplete };
    }
    const fromD = before.deferredToDate ?? null;
    const toD = after.deferredToDate ?? null;
    if (fromD !== toD) {
      changes.deferredToDate = { from: fromD, to: toD };
    }
  }

  return Object.keys(changes).length > 0 ? { changes } : null;
}

export function makeUpdateTaskAction(
  taskRepo: TaskRepository,
  tagRepo: TagRepository,
  ledgerRepo: LedgerRepository,
  historyRepo: PlanHistoryRepository,
) {
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
        await historyRepo.append({
          userId: task.userId,
          type: 'task.bounty_earned',
          entityId: task.id,
          payload: { amount: updated.bounty.amount },
          correlation: `history-bounty:${correlation}`,
        });
      }
    }

    const payload = buildTaskUpdateHistoryPayload(task, updated, input);
    if (payload) {
      await historyRepo.append({
        userId: task.userId,
        type: 'task.updated',
        entityId: task.id,
        payload,
      });
    }

    return updated;
  };
}
