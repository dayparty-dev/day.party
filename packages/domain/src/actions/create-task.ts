import type { Task, TaskBounty, TaskEssentiality } from '@dayparty/core';
import type { PlanHistoryRepository } from '../interfaces/plan-history-repository';
import type { TaskRepository } from '../interfaces/task-repository';
import type { TagRepository } from '../interfaces/tag-repository';

export interface CreateTaskInput {
  userId: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  tagKey?: string;
  scheduledDate: string;
  estimatedMinutes?: number;
  essentiality?: TaskEssentiality;
  notesMarkdown?: string;
  bounty?: TaskBounty;
}

export function makeCreateTaskAction(
  taskRepo: TaskRepository,
  tagRepo: TagRepository,
  historyRepo: PlanHistoryRepository,
) {
  return async (input: CreateTaskInput): Promise<Task> => {
    if (input.tagKey) {
      const tag = await tagRepo.findByKey(input.userId, input.tagKey);
      if (!tag) {
        throw new Error(`Tag with key "${input.tagKey}" not found`);
      }
    }

    const existing = await taskRepo.findByUserAndDate(input.userId, input.scheduledDate);
    const position = existing.length;

    const task = await taskRepo.create({
      userId: input.userId,
      title: input.title,
      size: input.size,
      tagKey: input.tagKey,
      status: 'planned',
      isComplete: false,
      scheduledDate: input.scheduledDate,
      position,
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
      ...(input.essentiality !== undefined ? { essentiality: input.essentiality } : {}),
      ...(input.notesMarkdown !== undefined && input.notesMarkdown.trim() !== ''
        ? { notesMarkdown: input.notesMarkdown.trim() }
        : {}),
      ...(input.bounty !== undefined && input.bounty.amount > 0 ? { bounty: input.bounty } : {}),
    });

    await historyRepo.append({
      userId: input.userId,
      type: 'task.created',
      entityId: task.id,
      payload: { title: task.title, scheduledDate: task.scheduledDate },
    });

    return task;
  };
}
