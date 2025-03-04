import jwt from 'jsonwebtoken';

import { AuthTokenService } from './AuthTokenService';
import { AuthTokenSigningDTO } from '../_models/AuthTokenSigningDTO';
import { AuthTokenVerificationDTO } from '../_models/AuthTokenVerificationDTO';
import { AuthToken } from '../_models/AuthToken';

interface JsonWebTokenAuthTokenServiceConfig {
  secret: string;
  expirationTimeSecs?: string | number;
}

export class JsonWebTokenAuthTokenService implements AuthTokenService {
  private readonly config: JsonWebTokenAuthTokenServiceConfig;

  constructor(env = process.env) {
    this.config = {
      secret: env.JWT_SECRET,
      expirationTimeSecs: env.JWT_EXPIRATION_TIME_SECS,
    };
  }

  public signToken(authTokenSigningDTO: AuthTokenSigningDTO): string {
    const token = jwt.sign(authTokenSigningDTO, this.config.secret, {
      subject: authTokenSigningDTO.email,
      expiresIn: this.config.expirationTimeSecs,
    });

    return token;
  }

  public verifyToken(verificationDTO: AuthTokenVerificationDTO): AuthToken {
    const { token } = verificationDTO;

    try {
      const verifiedToken = jwt.verify(token, this.config.secret) as object;

      const authToken = this.adaptJwtTokenToAuthToken(verifiedToken);

      return authToken;
    } catch (err) {
      throw new Error('Invalid/expired token');
    }
  }

  public adaptJwtTokenToAuthToken(jwtToken: any): AuthToken {
    const { sessionId, email, exp } = jwtToken;

    // TODO: actually check if session exists

    const expiresAt = new Date(exp);

    const authToken: AuthToken = {
      sessionId,
      email,
      expiresAt,
    };

    return authToken;
  }
}
