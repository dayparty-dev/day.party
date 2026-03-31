import { ObjectId, type Db, type Collection } from 'mongodb';
import type { User } from '@dayparty/core';
import type { UserRepository } from '@dayparty/domain';

type UserDoc = Omit<User, 'id'> & { _id: ObjectId };

function docToUser(doc: UserDoc): User {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}

export class MongoUserRepository implements UserRepository {
  private collection: Collection<UserDoc>;

  constructor(db: Db) {
    this.collection = db.collection<UserDoc>('users');
  }

  async findById(id: string): Promise<User | null> {
    if (!ObjectId.isValid(id)) return null;
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    return doc ? docToUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? docToUser(doc) : null;
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
