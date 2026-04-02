import { ObjectId, type Collection, type Db } from 'mongodb';
import { DEFAULT_DAY_WINDOW, DEFAULT_VISUAL_PRESET, type UserPreferences } from '@dayparty/core';
import type { UserPreferencesRepository } from '@dayparty/domain';

type UserPrefsDoc = UserPreferences & { _id: ObjectId };

function docToPrefs({ _id, ...rest }: UserPrefsDoc): UserPreferences {
  void _id;
  return {
    ...rest,
    dayWindow: rest.dayWindow ?? DEFAULT_DAY_WINDOW,
    visualPreset: rest.visualPreset ?? DEFAULT_VISUAL_PRESET,
  };
}

export class MongoUserPreferencesRepository implements UserPreferencesRepository {
  private collection: Collection<UserPrefsDoc>;

  constructor(db: Db) {
    this.collection = db.collection<UserPrefsDoc>('user_preferences');
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const doc = await this.collection.findOne({ userId });
    return doc ? docToPrefs(doc) : null;
  }

  async put(preferences: UserPreferences): Promise<UserPreferences> {
    const updatedAt = new Date().toISOString();
    const stored: UserPreferences = { ...preferences, updatedAt };
    const existing = await this.collection.findOne({ userId: preferences.userId });
    if (existing) {
      await this.collection.updateOne({ userId: preferences.userId }, { $set: stored });
    } else {
      await this.collection.insertOne({ _id: new ObjectId(), ...stored });
    }
    return stored;
  }
}
