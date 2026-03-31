import { MongoClient, type Db, type Collection, type Document } from 'mongodb';

let client: MongoClient | null = null;

export async function getDb(uri: string, dbName: string): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

export function getCollection<T extends Document>(db: Db, name: string): Collection<T> {
  return db.collection<T>(name);
}
