import { UserRole } from 'app/user/_models/User';

export interface AuthToken {
  sessionId: string;
  email: string;
  userId: string;
  role: UserRole;
  expiresAt: Date;
}
