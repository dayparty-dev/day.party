import { ObjectId, type Db, type Collection } from 'mongodb';
import { DEFAULT_SIZE_TO_MINUTES, type Task, type TaskBounty, type TaskStatus } from '@dayparty/core';
import type { TaskRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

const TASK_STATUSES: readonly TaskStatus[] = ['planned', 'in_progress', 'done', 'skipped', 'deferred'];

function isStoredStatus(s: unknown): s is TaskStatus {
  return typeof s === 'string' && TASK_STATUSES.includes(s as TaskStatus);
}

type TaskDoc = {
  _id: ObjectId;
  userId: string;
  title: string;
  size: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes?: number;
  essentiality?: Task['essentiality'];
  status?: TaskStatus;
  deferredToDate?: string;
  tagKey?: string;
  notesMarkdown?: string;
  bounty?: TaskBounty;
  focusedSecondsTotal?: number;
  focusSessionStartedAt?: string;
  isComplete: boolean;
  scheduledDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

function docToTask(doc: TaskDoc): Task {
  const { _id, ...rest } = doc;
  const id = bsonIdToString(_id);
  const estimatedMinutes =
    rest.estimatedMinutes != null && Number.isFinite(rest.estimatedMinutes)
      ? rest.estimatedMinutes
      : DEFAULT_SIZE_TO_MINUTES[rest.size];

  const status: TaskStatus = rest.isComplete ? 'done' : isStoredStatus(rest.status) ? rest.status : 'planned';

  const notesMarkdown =
    typeof rest.notesMarkdown === 'string' && rest.notesMarkdown.length > 0 ? rest.notesMarkdown : undefined;

  const bounty =
    rest.bounty != null &&
    typeof rest.bounty === 'object' &&
    typeof rest.bounty.amount === 'number' &&
    Number.isFinite(rest.bounty.amount) &&
    rest.bounty.amount > 0
      ? rest.bounty
      : undefined;

  const focusedSecondsTotal =
    typeof rest.focusedSecondsTotal === 'number' && Number.isFinite(rest.focusedSecondsTotal)
      ? Math.max(0, Math.floor(rest.focusedSecondsTotal))
      : undefined;

  const focusSessionStartedAt =
    typeof rest.focusSessionStartedAt === 'string' && rest.focusSessionStartedAt.length > 0
      ? rest.focusSessionStartedAt
      : undefined;

  return {
    id,
    userId: rest.userId,
    title: rest.title,
    size: rest.size,
    estimatedMinutes,
    essentiality: rest.essentiality,
    status,
    deferredToDate: typeof rest.deferredToDate === 'string' ? rest.deferredToDate : undefined,
    tagKey: rest.tagKey,
    ...(notesMarkdown !== undefined ? { notesMarkdown } : {}),
    ...(bounty !== undefined ? { bounty } : {}),
    ...(focusedSecondsTotal !== undefined ? { focusedSecondsTotal } : {}),
    ...(focusSessionStartedAt !== undefined ? { focusSessionStartedAt } : {}),
    isComplete: rest.isComplete,
    scheduledDate: rest.scheduledDate,
    position: rest.position,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
  };
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
    const { notesMarkdown, bounty, focusSessionStartedAt, ...rest } = fields;
    const $set: Record<string, unknown> = { ...rest, updatedAt };
    const $unset: Record<string, ''> = {};
    if ('focusSessionStartedAt' in fields) {
      delete $set.focusSessionStartedAt;
      if (typeof focusSessionStartedAt === 'string' && focusSessionStartedAt.length > 0) {
        $set.focusSessionStartedAt = focusSessionStartedAt;
      } else {
        $unset.focusSessionStartedAt = '';
      }
    }
    if ('notesMarkdown' in fields) {
      delete $set.notesMarkdown;
      if (notesMarkdown && notesMarkdown.length > 0) {
        $set.notesMarkdown = notesMarkdown;
      } else {
        $unset.notesMarkdown = '';
      }
    }
    if ('bounty' in fields) {
      delete $set.bounty;
      if (bounty != null && typeof bounty.amount === 'number' && bounty.amount > 0) {
        $set.bounty = bounty;
      } else {
        $unset.bounty = '';
      }
    }
    const updateDoc: { $set: Record<string, unknown>; $unset?: Record<string, ''> } = { $set };
    if (Object.keys($unset).length > 0) {
      updateDoc.$unset = $unset;
    }
    const result = await this.collection.findOneAndUpdate({ _id: new ObjectId(id) }, updateDoc, {
      returnDocument: 'after',
    });
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
