import type { Task } from '@dayparty/core';

export interface TaskRepository {
  findByUserAndDate(userId: string, date: string): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  update(id: string, fields: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Promise<Task | null>;
  delete(id: string): Promise<void>;
  reorder(updates: Array<{ id: string; position: number }>): Promise<void>;
  /** Sets tagKey to unset for all tasks of the user referencing the given tag key */
  nullifyTagKeyForUser(userId: string, tagKey: string): Promise<void>;
}
