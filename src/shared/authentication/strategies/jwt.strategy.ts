import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigurationService } from '../../configuration/configuration.service';
import { AuthenticationService } from '../authentication.service';
import { JwtPayload } from '../jwt-payload.interface';
import { User } from '../../../user/user.entity';
import { UnauthorizedError } from '../unauthorized.error';
import { isNil } from '../../utils/objects.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly configurationService: ConfigurationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configurationService.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.validateUser(payload);

    if (isNil(user)) {
      throw new UnauthorizedError();
    }

    return user;
  }
}
