import { UserRole } from 'app/user/_models/User';
import { JwtPayload } from 'jwt-decode';

export interface AuthTokenJwt extends JwtPayload {
  sessionId: string;
  email: string;
  userId: string;
  role?: UserRole;
  // Standard JWT fields included via JwtPayload:
  // sub, iat, exp, etc.
}
