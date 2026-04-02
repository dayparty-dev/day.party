import type { User } from '@dayparty/core';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** Case-insensitive substring match on email (admin support search). */
  searchByEmailSubstring(fragment: string, limit: number): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, fields: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null>;
}
