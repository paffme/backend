import {inject} from '@loopback/context';
import {HttpErrors} from '@loopback/rest';
import {TokenService} from '@loopback/authentication';
import {securityId, UserProfile} from '@loopback/security';
import {TokenServiceBindings} from '../keys';
import * as jwt from 'jsonwebtoken';

export class JWTService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
  ) {}

  async verifyToken(token: string): Promise<UserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token: 'token' is null`,
      );
    }

    try {
      const decryptedToken = jwt.verify(token, this.jwtSecret) as UserProfile;

      return {
        [securityId]: decryptedToken.id,
        email: decryptedToken.email,
        name: decryptedToken.name,
      };
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token: ${error.message}`,
      );
    }
  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error generating token: userProfile is null',
      );
    }securityId

    let token: string;

    try {
      token = jwt.sign({
        ...userProfile,
        id: userProfile[securityId],
      }, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token: ${error}`);
    }

    return token;
  }
}
