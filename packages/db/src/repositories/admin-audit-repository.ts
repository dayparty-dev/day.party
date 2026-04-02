import { ObjectId, type Db, type Collection, type Filter } from 'mongodb';
import type { AdminAuditEvent } from '@dayparty/core';
import type { AdminAuditListResult, AdminAuditRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

type AdminAuditDoc = Omit<AdminAuditEvent, 'id'> & { _id: ObjectId };

function docToRow(doc: AdminAuditDoc): AdminAuditEvent {
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

export class MongoAdminAuditRepository implements AdminAuditRepository {
  private collection: Collection<AdminAuditDoc>;

  constructor(db: Db) {
    this.collection = db.collection<AdminAuditDoc>('admin_audit_events');
  }

  async append(row: Omit<AdminAuditEvent, 'id'> & { id?: string }): Promise<AdminAuditEvent> {
    const _id = new ObjectId();
    const doc: AdminAuditDoc = {
      _id,
      actorUserId: row.actorUserId,
      action: row.action,
      targetType: row.targetType,
      summary: row.summary,
      createdAt: row.createdAt,
      ...(row.targetId !== undefined && row.targetId !== null && row.targetId !== '' ? { targetId: row.targetId } : {}),
      ...(row.metadata && Object.keys(row.metadata).length > 0 ? { metadata: row.metadata } : {}),
    };
    await this.collection.insertOne(doc);
    return docToRow(doc);
  }

  async listDescending(limit: number, cursor?: string | null): Promise<AdminAuditListResult> {
    const cap = Math.min(100, Math.max(1, limit));
    const take = cap + 1;
    let filter: Filter<AdminAuditDoc> = {};
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
