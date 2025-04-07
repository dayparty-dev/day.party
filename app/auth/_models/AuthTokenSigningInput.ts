import { UserRole } from 'app/user/_models/User';

export interface AuthTokenSigningInput {
  sessionId: string;
  email: string;
  userId: string;
  role?: UserRole;
}
