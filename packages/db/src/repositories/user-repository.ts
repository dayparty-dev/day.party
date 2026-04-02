import { ObjectId, type Db, type Collection } from 'mongodb';
import type { User } from '@dayparty/core';
import type { UserRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type UserDoc = Omit<User, 'id'> & { _id: ObjectId };

function docToUser(doc: UserDoc): User {
  const { _id, ...rest } = doc;
  const role = rest.role === 'admin' || rest.role === 'user' ? rest.role : 'user';
  return { id: bsonIdToString(_id), ...rest, role };
}

export class MongoUserRepository implements UserRepository {
  private collection: Collection<UserDoc>;

  constructor(db: Db) {
    this.collection = db.collection<UserDoc>('users');
  }

  async findById(id: string): Promise<User | null> {
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const doc = await this.collection.findOne(query as never);
    return doc ? docToUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? docToUser(doc) : null;
  }

  async searchByEmailSubstring(fragment: string, limit: number): Promise<User[]> {
    const trimmed = fragment.trim();
    if (!trimmed) {
      return [];
    }
    const cap = Math.min(100, Math.max(1, limit));
    const docs = await this.collection
      .find({ email: { $regex: escapeRegex(trimmed), $options: 'i' } })
      .limit(cap)
      .toArray();
    return docs.map(docToUser);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    const _id = new ObjectId();
    const doc: UserDoc = { _id, ...user, createdAt: now, updatedAt: now };
    await this.collection.insertOne(doc);
    return docToUser(doc);
  }

  async update(id: string, fields: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null;
    const updatedAt = new Date().toISOString();
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...fields, updatedAt } },
      { returnDocument: 'after' },
    );
    return result ? docToUser(result) : null;
  }
}
