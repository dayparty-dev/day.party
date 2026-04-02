import { ObjectId, type Db, type Collection } from 'mongodb';
import { DEFAULT_SIZE_TO_MINUTES, type Task } from '@dayparty/core';
import type { TaskRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

type TaskDoc = Omit<Task, 'id'> & { _id: ObjectId };

function docToTask(doc: TaskDoc): Task {
  const { _id, ...rest } = doc;
  const id = bsonIdToString(_id);
  const estimatedMinutes =
    rest.estimatedMinutes != null && Number.isFinite(rest.estimatedMinutes)
      ? rest.estimatedMinutes
      : DEFAULT_SIZE_TO_MINUTES[rest.size];
  return { id, ...rest, estimatedMinutes };
}

export class MongoTaskRepository implements TaskRepository {
  private collection: Collection<TaskDoc>;

  constructor(db: Db) {
    this.collection = db.collection<TaskDoc>('tasks');
  }

  async findByUserAndDate(userId: string, date: string): Promise<Task[]> {
    const docs = await this.collection.find({ userId, scheduledDate: date }).sort({ position: 1 }).toArray();
    return docs.map(docToTask);
  }

  async findById(id: string): Promise<Task | null> {
    if (!ObjectId.isValid(id)) return null;
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    return doc ? docToTask(doc) : null;
  }

  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date().toISOString();
    const _id = new ObjectId();
    const doc: TaskDoc = { _id, ...task, createdAt: now, updatedAt: now };
    await this.collection.insertOne(doc);
    return docToTask(doc);
  }

  async update(id: string, fields: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Promise<Task | null> {
    if (!ObjectId.isValid(id)) return null;
    const updatedAt = new Date().toISOString();
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...fields, updatedAt } },
      { returnDocument: 'after' },
    );
    return result ? docToTask(result) : null;
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;
    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async reorder(updates: Array<{ id: string; position: number }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, position }) => {
        if (!ObjectId.isValid(id)) return Promise.resolve();
        return this.collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { position, updatedAt: new Date().toISOString() } },
        );
      }),
    );
  }

  async nullifyTagKeyForUser(userId: string, tagKey: string): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.collection.updateMany({ userId, tagKey }, { $unset: { tagKey: '' }, $set: { updatedAt } });
  }
}
