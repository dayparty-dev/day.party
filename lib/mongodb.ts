import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'dayparty';

let db: Db;

export async function getDb() {
  console.log('getDb', uri, dbName);
  if (!db) {
    const client = new MongoClient(uri);
    db = await connectToDatabase(client);
  }

  return db;
}

export async function getCollection<T>(collectionName: string) {
  const db = await getDb();

  return db.collection<T>(collectionName);
}

async function connectToDatabase(client: MongoClient) {
  try {
    await client.connect();
    return client.db(dbName);
  } catch (e) {
    // MongoServerError and MongoError both have code property
    if (e?.code === 100) {
      return client.db(dbName);
    }
    throw e;
  }
}
