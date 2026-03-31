import type { User } from '@dayparty/core';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, fields: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null>;
}
