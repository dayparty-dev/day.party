import { ObjectId, type Collection, type Db } from 'mongodb';
import type { RewardDefinition, RewardDefinitionType } from '@dayparty/core';
import type { RewardDefinitionRepository } from '@dayparty/domain';
import { bsonIdToString } from '../bson-id';

const TYPES: readonly RewardDefinitionType[] = ['instant', 'banked', 'scheduled'];

function isRewardType(v: unknown): v is RewardDefinitionType {
  return typeof v === 'string' && TYPES.includes(v as RewardDefinitionType);
}

type RewardDoc = {
  _id: ObjectId;
  userId: string;
  name: string;
  type: RewardDefinitionType;
  costCurrency: number;
  metadata?: Record<string, unknown>;
};

function docToReward(doc: RewardDoc): RewardDefinition {
  const { _id, userId, name, type, costCurrency, metadata } = doc;
  const def: RewardDefinition = {
    id: bsonIdToString(_id),
    userId,
    name,
    type,
    costCurrency,
  };
  if (metadata != null && Object.keys(metadata).length > 0) {
    def.metadata = metadata;
  }
  return def;
}

export class MongoRewardDefinitionRepository implements RewardDefinitionRepository {
  private collection: Collection<RewardDoc>;

  constructor(db: Db) {
    this.collection = db.collection<RewardDoc>('reward_definitions');
  }

  async listByUserId(userId: string): Promise<RewardDefinition[]> {
    const docs = await this.collection.find({ userId }).sort({ name: 1 }).toArray();
    return docs.map((d) => docToReward({ ...d, type: isRewardType(d.type) ? d.type : 'instant' }));
  }

  async findById(id: string): Promise<RewardDefinition | null> {
    if (!ObjectId.isValid(id)) return null;
    const doc = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return docToReward({ ...doc, type: isRewardType(doc.type) ? doc.type : 'instant' });
  }

  async create(definition: Omit<RewardDefinition, 'id'>): Promise<RewardDefinition> {
    const _id = new ObjectId();
    const doc: RewardDoc = {
      _id,
      userId: definition.userId,
      name: definition.name,
      type: definition.type,
      costCurrency: definition.costCurrency,
      ...(definition.metadata != null ? { metadata: definition.metadata } : {}),
    };
    await this.collection.insertOne(doc);
    return docToReward(doc);
  }
}
