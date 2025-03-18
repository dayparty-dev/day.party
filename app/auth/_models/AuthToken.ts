export interface AuthToken {
  sessionId: string;
  email: string;
  userId: string;
  expiresAt: Date;
}
