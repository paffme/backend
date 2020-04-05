import { BaseAuthorizationGuard } from '../guards/base.authorization.guard';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserAuthorizationService } from './user.authorization.service';
import { User } from '../../user/user.entity';

@Injectable()
export class UserAuthorizationGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    private userAuthorizationService: UserAuthorizationService,
  ) {
    super(reflector, User.name);
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    return super.authorize(
      context,
      this.userAuthorizationService,
      Number(request.params.userId),
    );
  }
}
