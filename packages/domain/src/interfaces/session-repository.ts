import type { Session } from '@dayparty/core';

export interface SessionRepository {
  findByToken(token: string): Promise<Session | null>;
  create(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session>;
  deleteByToken(token: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
