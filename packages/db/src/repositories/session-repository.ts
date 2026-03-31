import { ObjectId, type Db, type Collection } from 'mongodb';
import type { Session } from '@dayparty/core';
import type { SessionRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

type SessionDoc = Omit<Session, 'id'> & { _id: ObjectId };

function docToSession(doc: SessionDoc): Session {
  const { _id, ...rest } = doc;
  return { id: bsonIdToString(_id), ...rest };
}

export class MongoSessionRepository implements SessionRepository {
  private collection: Collection<SessionDoc>;

  constructor(db: Db) {
    this.collection = db.collection<SessionDoc>('sessions');
  }

  async findByToken(token: string): Promise<Session | null> {
    const doc = await this.collection.findOne({ token });
    return doc ? docToSession(doc) : null;
  }

  async create(session: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const createdAt = new Date().toISOString();
    const _id = new ObjectId();
    const doc: SessionDoc = { _id, ...session, createdAt };
    await this.collection.insertOne(doc);
    return docToSession(doc);
  }

  async deleteByToken(token: string): Promise<void> {
    await this.collection.deleteOne({ token });
  }

  async deleteExpired(): Promise<void> {
    const now = new Date().toISOString();
    await this.collection.deleteMany({ expiresAt: { $lt: now } });
  }
}
