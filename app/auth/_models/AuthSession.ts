import { Entity } from 'app/_models/Entity';

export interface AuthSession extends Entity {
  email: string;
  isActive: boolean;
  userId?: string; // Optional initially, will be set during verification
}
