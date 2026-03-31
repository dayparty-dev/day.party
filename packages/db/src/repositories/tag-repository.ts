import { ObjectId, type Db, type Collection } from 'mongodb';
import type { Tag } from '@dayparty/core';
import { DEFAULT_TAGS } from '@dayparty/core';
import type { TagRepository } from '@dayparty/domain';

type TagDoc = Omit<Tag, 'id'> & { _id: ObjectId };

function docToTag(doc: TagDoc): Tag {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest };
}

export class MongoTagRepository implements TagRepository {
  private collection: Collection<TagDoc>;

  constructor(db: Db) {
    this.collection = db.collection<TagDoc>('tags');
  }

  async findByUser(userId: string): Promise<Tag[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map(docToTag);
  }

  async findByKey(userId: string, key: string): Promise<Tag | null> {
    const doc = await this.collection.findOne({ userId, key });
    return doc ? docToTag(doc) : null;
  }

  async create(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const createdAt = new Date().toISOString();
    const _id = new ObjectId();
    const doc: TagDoc = { _id, ...tag, createdAt };
    await this.collection.insertOne(doc);
    return docToTag(doc);
  }

  async update(id: string, fields: Partial<Omit<Tag, 'id' | 'userId' | 'createdAt'>>): Promise<Tag | null> {
    if (!ObjectId.isValid(id)) return null;
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: fields },
      { returnDocument: 'after' },
    );
    return result ? docToTag(result) : null;
  }

  async delete(id: string): Promise<void> {
    if (!ObjectId.isValid(id)) return;
    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async seedDefaults(userId: string): Promise<void> {
    const existing = await this.collection.findOne({ userId, isDefault: true });
    if (existing) return;

    const createdAt = new Date().toISOString();
    const docs: TagDoc[] = DEFAULT_TAGS.map((tag) => ({
      _id: new ObjectId(),
      userId,
      ...tag,
      createdAt,
    }));
    await this.collection.insertMany(docs);
  }
}
