import { ObjectId, type Collection, type Db, type Filter } from 'mongodb';
import type { PlanHistoryEvent } from '@dayparty/core';
import type {
  PlanHistoryAppendInput,
  PlanHistoryListParams,
  PlanHistoryListResult,
  PlanHistoryRepository,
} from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

const CURSOR_SEP = '\u001f';

type Order = 'asc' | 'desc';

function encodeHistoryCursor(order: Order, timestamp: string, id: string): string {
  const raw = `${order}${CURSOR_SEP}${timestamp}${CURSOR_SEP}${id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

function decodeHistoryCursor(cursor: string): { order: Order; timestamp: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parts = raw.split(CURSOR_SEP);
    if (parts.length !== 3) return null;
    const [order, timestamp, id] = parts as [string, string, string];
    if (order !== 'asc' && order !== 'desc') return null;
    if (!ObjectId.isValid(id)) return null;
    return { order, timestamp, id };
  } catch {
    return null;
  }
}

type PlanHistoryDoc = {
  _id: ObjectId;
  userId: string;
  timestamp: string;
  type: string;
  entityId: string;
  payload: Record<string, unknown>;
  correlation?: string;
};

function docToEvent(doc: PlanHistoryDoc): PlanHistoryEvent {
  const { _id, ...rest } = doc;
  return {
    id: bsonIdToString(_id),
    userId: rest.userId,
    timestamp: rest.timestamp,
    type: rest.type,
    entityId: rest.entityId,
    payload: rest.payload,
    ...(typeof rest.correlation === 'string' && rest.correlation.length > 0 ? { correlation: rest.correlation } : {}),
  };
}

export class MongoPlanHistoryRepository implements PlanHistoryRepository {
  private collection: Collection<PlanHistoryDoc>;

  constructor(db: Db) {
    this.collection = db.collection<PlanHistoryDoc>('plan_history_events');
  }

  async append(input: PlanHistoryAppendInput): Promise<PlanHistoryEvent | null> {
    if (input.correlation != null && input.correlation.length > 0) {
      const dup = await this.collection.findOne({ userId: input.userId, correlation: input.correlation });
      if (dup) {
        return null;
      }
    }

    const _id = new ObjectId();
    const timestamp = new Date().toISOString();
    const doc: PlanHistoryDoc = {
      _id,
      userId: input.userId,
      timestamp,
      type: input.type,
      entityId: input.entityId,
      payload: input.payload,
      ...(input.correlation != null && input.correlation.length > 0 ? { correlation: input.correlation } : {}),
    };
    await this.collection.insertOne(doc);
    return docToEvent(doc);
  }

  async listByUserId(userId: string, params: PlanHistoryListParams): Promise<PlanHistoryListResult> {
    const order: Order = params.order === 'asc' ? 'asc' : 'desc';
    const limit = Math.min(Math.max(params.limit, 1), 100);

    let filter: Filter<PlanHistoryDoc> = { userId };
    if (params.cursor) {
      const decoded = decodeHistoryCursor(params.cursor);
      if (decoded && decoded.order === order && ObjectId.isValid(decoded.id)) {
        const oid = new ObjectId(decoded.id);
        if (order === 'desc') {
          filter = {
            userId,
            $or: [{ timestamp: { $lt: decoded.timestamp } }, { timestamp: decoded.timestamp, _id: { $lt: oid } }],
          };
        } else {
          filter = {
            userId,
            $or: [{ timestamp: { $gt: decoded.timestamp } }, { timestamp: decoded.timestamp, _id: { $gt: oid } }],
          };
        }
      }
    }

    const sort = order === 'desc' ? ({ timestamp: -1, _id: -1 } as const) : ({ timestamp: 1, _id: 1 } as const);

    const docs = await this.collection
      .find(filter)
      .sort(sort)
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const events = slice.map(docToEvent);
    const last = events[events.length - 1];
    const nextCursor = hasMore && last ? encodeHistoryCursor(order, last.timestamp, last.id) : undefined;

    return { events, nextCursor };
  }
}
