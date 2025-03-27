import { JwtPayload } from 'jwt-decode';

export interface AuthTokenJwt extends JwtPayload {
  sessionId: string;
  email: string;
  userId: string;
  // Standard JWT fields included via JwtPayload:
  // sub, iat, exp, etc.
}
