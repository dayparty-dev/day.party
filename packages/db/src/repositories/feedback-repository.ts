import { ObjectId, type Db, type Collection, type Filter } from 'mongodb';
import type { FeedbackSubmission } from '@dayparty/core';
import type { FeedbackListResult, FeedbackRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

type FeedbackDoc = Omit<FeedbackSubmission, 'id'> & { _id: ObjectId };

function docToRow(doc: FeedbackDoc): FeedbackSubmission {
  const { _id, ...rest } = doc;
  return { id: bsonIdToString(_id), ...rest };
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}\n${id}`, 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const nl = raw.indexOf('\n');
    if (nl < 0) {
      return null;
    }
    const createdAt = raw.slice(0, nl);
    const id = raw.slice(nl + 1);
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}

export class MongoFeedbackRepository implements FeedbackRepository {
  private collection: Collection<FeedbackDoc>;

  constructor(db: Db) {
    this.collection = db.collection<FeedbackDoc>('feedback_submissions');
  }

  async create(
    row: Omit<FeedbackSubmission, 'id' | 'createdAt'> & { createdAt?: string },
  ): Promise<FeedbackSubmission> {
    const _id = new ObjectId();
    const createdAt = row.createdAt ?? new Date().toISOString();
    const doc: FeedbackDoc = {
      _id,
      userId: row.userId,
      message: row.message,
      createdAt,
      ...(row.category ? { category: row.category } : {}),
      ...(row.userAgent ? { userAgent: row.userAgent } : {}),
    };
    await this.collection.insertOne(doc);
    return docToRow(doc);
  }

  async listForAdmin(limit: number, cursor?: string | null): Promise<FeedbackListResult> {
    const cap = Math.min(100, Math.max(1, limit));
    const take = cap + 1;
    let filter: Filter<FeedbackDoc> = {};
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        const oid = new ObjectId(decoded.id);
        filter = {
          $or: [{ createdAt: { $lt: decoded.createdAt } }, { createdAt: decoded.createdAt, _id: { $lt: oid } }],
        };
      }
    }
    const docs = await this.collection.find(filter).sort({ createdAt: -1, _id: -1 }).limit(take).toArray();
    const hasMore = docs.length > cap;
    const slice = hasMore ? docs.slice(0, cap) : docs;
    const last = slice[slice.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, bsonIdToString(last._id)) : null;
    return { items: slice.map(docToRow), nextCursor };
  }
}
