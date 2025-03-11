import { Entity } from 'app/_models/Entity';

export interface User extends Entity {
  email: string;
  username: string;
}
