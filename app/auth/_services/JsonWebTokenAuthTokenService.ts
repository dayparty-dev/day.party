import jwt from 'jsonwebtoken';

import { AuthTokenService } from './AuthTokenService';
import { AuthTokenSigningInput } from '../_models/AuthTokenSigningInput';
import { AuthTokenVerificationInput } from '../_models/AuthTokenVerificationInput';
import { AuthToken } from '../_models/AuthToken';
import { AuthTokenJwt } from '../_models/AuthTokenJwt';

interface JsonWebTokenAuthTokenServiceConfig {
  secret: string;
  expirationTimeSecs: string;
}

export class JsonWebTokenAuthTokenService implements AuthTokenService {
  private readonly config: JsonWebTokenAuthTokenServiceConfig;

  constructor(env = process.env) {
    this.config = {
      secret: env.JWT_SECRET,
      expirationTimeSecs: env.JWT_EXPIRATION_TIME_SECS,
    };
  }

  public signToken(authTokenSigningDTO: AuthTokenSigningInput): string {
    const token = jwt.sign(authTokenSigningDTO, this.config.secret, {
      subject: authTokenSigningDTO.email,
      expiresIn: parseInt(this.config.expirationTimeSecs),
    });

    console.log('token', token);

    return token;
  }

  public verifyToken(verificationDTO: AuthTokenVerificationInput): AuthToken {
    const { token } = verificationDTO;

    try {
      const verifiedToken = jwt.verify(
        token,
        this.config.secret
      ) as AuthTokenJwt;

      const authToken = this.adaptJwtTokenToAuthToken(verifiedToken);

      return authToken;
    } catch (err) {
      console.log('err', err);
      throw new Error('Invalid/expired token');
    }
  }

  public adaptJwtTokenToAuthToken(jwtToken: AuthTokenJwt): AuthToken {
    const { sessionId, email, userId, exp } = jwtToken;

    // TODO: actually check if session exists

    const expiresAt = new Date(exp * 1000);

    const authToken: AuthToken = {
      sessionId,
      email,
      userId,
      expiresAt,
    };

    return authToken;
  }
}
