import { ObjectId } from 'mongodb';

/** Maps stored `_id` (ObjectId or legacy string) to domain string ids. */
export function bsonIdToString(id: unknown): string {
  if (id instanceof ObjectId) return id.toHexString();
  if (typeof id === 'string') return id;
  throw new TypeError(`Invalid BSON _id type: ${typeof id}`);
}
