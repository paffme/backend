import * as uuid from 'uuid';
import { Algorithm, SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../../user/user.entity';
import { ConfigurationService } from '../configuration/configuration.service';
import { JwtDto } from './jwt.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly jwtOptions: SignOptions;

  constructor(
    @Inject(forwardRef(() => UserService)) readonly userService: UserService,
    private readonly configurationService: ConfigurationService,
    private jwtService: JwtService,
  ) {
    this.jwtOptions = {
      algorithm: configurationService.get('JWT_ALGORITHM') as Algorithm,
      expiresIn: ms(configurationService.get('JWT_EXPIRATION')) / 1000,
      issuer: configurationService.get('JWT_ISSUER'),
    };
  }

  signPayload(payload: JwtPayload): JwtDto {
    const token = this.jwtService.sign(payload, {
      ...this.jwtOptions,
      subject: String(payload.id),
      jwtid: uuid.v4(),
    });

    return {
      token,
      createdAt: new Date(),
      expiresIn: this.jwtOptions.expiresIn as number,
    };
  }

  async validateUser(validatePayload: JwtPayload): Promise<User> {
    return this.userService.getOrFail(validatePayload.id);
  }
}
