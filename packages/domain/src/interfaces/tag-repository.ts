import type { Tag } from '@dayparty/core';

export interface TagRepository {
  findByUser(userId: string): Promise<Tag[]>;
  findByKey(userId: string, key: string): Promise<Tag | null>;
  create(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag>;
  update(id: string, fields: Partial<Omit<Tag, 'id' | 'userId' | 'createdAt'>>): Promise<Tag | null>;
  delete(id: string): Promise<void>;
  seedDefaults(userId: string): Promise<void>;
}
