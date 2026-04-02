import { ObjectId, type Collection, type Db, type Filter } from 'mongodb';
import type { LedgerEntry, LedgerEntryReason } from '@dayparty/core';
import type { LedgerListParams, LedgerListResult, LedgerRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

const REASONS: readonly LedgerEntryReason[] = ['task_completion', 'purchase', 'adjustment'];

function isLedgerReason(v: unknown): v is LedgerEntryReason {
  return typeof v === 'string' && REASONS.includes(v as LedgerEntryReason);
}

const CURSOR_SEP = '\u001f';

function encodeLedgerCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}${CURSOR_SEP}${id}`, 'utf8').toString('base64url');
}

function decodeLedgerCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const i = raw.indexOf(CURSOR_SEP);
    if (i === -1) return null;
    return { createdAt: raw.slice(0, i), id: raw.slice(i + CURSOR_SEP.length) };
  } catch {
    return null;
  }
}

type LedgerDoc = {
  _id: ObjectId;
  userId: string;
  amount: number;
  reason: LedgerEntryReason;
  correlation?: string;
  createdAt: string;
};

function docToEntry(doc: LedgerDoc): LedgerEntry {
  const { _id, ...rest } = doc;
  const reason = isLedgerReason(rest.reason) ? rest.reason : 'adjustment';
  return {
    id: bsonIdToString(_id),
    userId: rest.userId,
    amount: rest.amount,
    reason,
    ...(typeof rest.correlation === 'string' && rest.correlation.length > 0 ? { correlation: rest.correlation } : {}),
    createdAt: rest.createdAt,
  };
}

export class MongoLedgerRepository implements LedgerRepository {
  private collection: Collection<LedgerDoc>;

  constructor(db: Db) {
    this.collection = db.collection<LedgerDoc>('ledger_entries');
  }

  async insert(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
    const _id = new ObjectId();
    const createdAt = new Date().toISOString();
    const doc: LedgerDoc = {
      _id,
      userId: entry.userId,
      amount: entry.amount,
      reason: entry.reason,
      ...(entry.correlation != null && entry.correlation.length > 0 ? { correlation: entry.correlation } : {}),
      createdAt,
    };
    await this.collection.insertOne(doc);
    return docToEntry(doc);
  }

  async listByUserId(userId: string, params: LedgerListParams): Promise<LedgerListResult> {
    const limit = Math.min(Math.max(params.limit, 1), 100);
    let filter: Filter<LedgerDoc> = { userId };
    if (params.cursor) {
      const decoded = decodeLedgerCursor(params.cursor);
      if (decoded && ObjectId.isValid(decoded.id)) {
        const oid = new ObjectId(decoded.id);
        filter = {
          userId,
          $or: [{ createdAt: { $lt: decoded.createdAt } }, { createdAt: decoded.createdAt, _id: { $lt: oid } }],
        };
      }
    }

    const docs = await this.collection
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const entries = slice.map(docToEntry);
    const last = entries[entries.length - 1];
    const nextCursor = hasMore && last ? encodeLedgerCursor(last.createdAt, last.id) : undefined;

    return { entries, nextCursor };
  }

  async findByCorrelation(userId: string, correlation: string): Promise<LedgerEntry | null> {
    const doc = await this.collection.findOne({ userId, correlation });
    return doc ? docToEntry(doc) : null;
  }

  async sumAmountByUserId(userId: string): Promise<number> {
    const agg = await this.collection
      .aggregate<{ s: number | null }>([{ $match: { userId } }, { $group: { _id: null, s: { $sum: '$amount' } } }])
      .toArray();
    const s = agg[0]?.s;
    return typeof s === 'number' && Number.isFinite(s) ? s : 0;
  }
}
