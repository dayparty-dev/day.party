import { MongoClient, type Db, type Collection, type Document } from 'mongodb';

let client: MongoClient | null = null;

export async function getDb(uri: string, dbName: string): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}

/** Close the shared client (e.g. after CLI scripts). Safe to call multiple times. */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}

export function getCollection<T extends Document>(db: Db, name: string): Collection<T> {
  return db.collection<T>(name);
}
