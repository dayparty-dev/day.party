import { AuthToken } from '../_models/AuthToken';
import { AuthTokenSigningInput } from '../_models/AuthTokenSigningInput';
import { AuthTokenVerificationInput } from '../_models/AuthTokenVerificationInput';

export interface AuthTokenService {
  signToken(authTokenSigningDTO: AuthTokenSigningInput): string;
  verifyToken(authTokenVerificationDTO: AuthTokenVerificationInput): AuthToken;
}
