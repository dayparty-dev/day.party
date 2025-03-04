import { AuthToken } from '../_models/AuthToken';
import { AuthTokenSigningDTO } from '../_models/AuthTokenSigningDTO';
import { AuthTokenVerificationDTO } from '../_models/AuthTokenVerificationDTO';

export interface AuthTokenService {
  signToken(authTokenSigningDTO: AuthTokenSigningDTO): string;
  verifyToken(authTokenVerificationDTO: AuthTokenVerificationDTO): AuthToken;
}
