import { nanoid } from 'nanoid';

import { User, UserRole } from '../_models/User';
import { getCollection } from 'lib/mongodb';

export class UserService {
  private readonly COLLECTION_NAME = 'users';

  async search(searchQuery: string): Promise<User[]> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    const regex = new RegExp(searchQuery, 'i');
    const query = {
      $or: [
        { email: regex },
        { username: regex },
        { _id: regex },
      ],
    };

    const users = await collection.find(query).toArray();
    
    return users;
  }

  async findById(id: string): Promise<User | null> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    return collection.findOne({ _id: id });
  }


  async findByEmail(email: string): Promise<User | null> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    return collection.findOne({ email });
  }

  async createUser(
    email: string,
    username: string,
    role: UserRole = UserRole.Standard
  ): Promise<User> { 
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    const now = new Date();
    const user: User = {
      _id: nanoid(),
      email,
      username,
      role,
      _createdAt: now,
      _updatedAt: now,
    };

    await collection.insertOne(user);

    return user;
  }

  async updateUserRole(
    userId: string,
    role: UserRole = UserRole.Standard
  ): Promise<void> {
    const collection = await getCollection<User>(this.COLLECTION_NAME);

    const now = new Date();

    await collection.updateOne({ _id: userId }, { $set: {
      role,
      _updatedAt: now,
    } });
  }
}

export const getUserService = () => new UserService();
