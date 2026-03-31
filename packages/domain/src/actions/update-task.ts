import type { Task } from '@dayparty/core';
import type { TaskRepository } from '../interfaces/task-repository';
import type { TagRepository } from '../interfaces/tag-repository';

export type UpdateTaskInput = Partial<{
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  tagKey: string | null;
  scheduledDate: string;
  isComplete: boolean;
}>;

export function makeUpdateTaskAction(taskRepo: TaskRepository, tagRepo: TagRepository) {
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

    const fields: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>> = {};
    if (input.title !== undefined) fields.title = input.title;
    if (input.size !== undefined) fields.size = input.size;
    if ('tagKey' in input) fields.tagKey = input.tagKey ?? undefined;
    if (input.scheduledDate !== undefined) fields.scheduledDate = input.scheduledDate;
    if (input.isComplete !== undefined) fields.isComplete = input.isComplete;

    const updated = await taskRepo.update(id, fields);
    if (!updated) {
      throw new Error(`Task "${id}" not found after update`);
    }

    return updated;
  };
}
