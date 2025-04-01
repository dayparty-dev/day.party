import { Entity } from 'app/_models/Entity';

export enum UserRole {
  Admin = 'admin',
  Premium = 'premium',
  Standard = 'standard',
}

export interface User extends Entity {
  email: string;
  username: string;
  role: UserRole;
}
