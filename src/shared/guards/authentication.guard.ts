import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../user/user-role.enum';
import { User } from '../../user/user.entity';
import { UnauthorizedError } from '../authentication/unauthorized.error';
import { isDefined, isNil } from '../utils/objects.helper';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<SystemRole[]>(
      'systemRoles',
      context.getHandler(),
    );

    if (isNil(roles) || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User | undefined | false = request.user;

    if (
      isDefined(user) &&
      typeof user !== 'boolean' &&
      roles.includes(user.systemRole)
    ) {
      return true;
    }

    throw new UnauthorizedError();
  }
}
