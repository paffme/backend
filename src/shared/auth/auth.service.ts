import * as uuid from 'uuid/v4';
import * as jwt from 'jsonwebtoken';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import * as ms from 'ms';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../../user/user.entity';
import { ConfigurationService } from '../configuration/configuration.service';
import { Configuration } from '../configuration/configuration.enum';
import { JwtDto } from './jwt.dto';

@Injectable()
export class AuthService {
  private readonly jwtOptions: SignOptions;
  private readonly jwtSecret: string;

  constructor(
    @Inject(forwardRef(() => UserService)) readonly userService: UserService,
    private readonly configurationService: ConfigurationService,
  ) {
    this.jwtOptions = {
      algorithm: configurationService.get(
        Configuration.JWT_ALGORITHM,
      ) as Algorithm,
      expiresIn:
        ms(configurationService.get(Configuration.JWT_EXPIRATION)) / 1000,
      issuer: configurationService.get(Configuration.JWT_ISSUER),
    };

    this.jwtSecret = configurationService.get(Configuration.JWT_SECRET);
  }

  async signPayload(payload: JwtPayload): Promise<JwtDto> {
    const token = await jwt.sign(payload, this.jwtSecret, {
      ...this.jwtOptions,
      subject: String(payload.id),
      jwtid: uuid(),
    });

    return {
      token,
      createdAt: new Date(),
      expiresIn: this.jwtOptions.expiresIn as number,
    };
  }

  async validateUser(validatePayload: JwtPayload): Promise<User> {
    return this.userService.findUserById(validatePayload.id);
  }
}
