import type { Task, TaskEssentiality } from '@dayparty/core';
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
}

export function makeCreateTaskAction(taskRepo: TaskRepository, tagRepo: TagRepository) {
  return async (input: CreateTaskInput): Promise<Task> => {
    if (input.tagKey) {
      const tag = await tagRepo.findByKey(input.userId, input.tagKey);
      if (!tag) {
        throw new Error(`Tag with key "${input.tagKey}" not found`);
      }
    }

    const existing = await taskRepo.findByUserAndDate(input.userId, input.scheduledDate);
    const position = existing.length;

    return taskRepo.create({
      userId: input.userId,
      title: input.title,
      size: input.size,
      tagKey: input.tagKey,
      isComplete: false,
      scheduledDate: input.scheduledDate,
      position,
      ...(input.estimatedMinutes !== undefined ? { estimatedMinutes: input.estimatedMinutes } : {}),
      ...(input.essentiality !== undefined ? { essentiality: input.essentiality } : {}),
    });
  };
}
