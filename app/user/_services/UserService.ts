import { nanoid } from 'nanoid';
import { User } from '../_models/User';
import { getCollection } from 'lib/mongodb';

export class UserService {
  private readonly COLLECTION_NAME = 'users';

  async findByEmail(email: string): Promise<User | null> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    return collection.findOne({ email });
  }

  async createUser(email: string, username: string): Promise<User> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    const now = new Date();
    const user: User = {
      _id: nanoid(),
      email,
      username,
      _createdAt: now,
      _updatedAt: now,
    };

    await collection.insertOne(user);

    return user;
  }
}

export const getUserService = () => new UserService();
