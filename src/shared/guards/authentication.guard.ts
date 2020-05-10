import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../user/user-role.enum';
import { User } from '../../user/user.entity';
import { UnauthorizedError } from '../authentication/unauthorized.error';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<SystemRole[]>(
      'systemRoles',
      context.getHandler(),
    );

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (user && roles.includes(user.systemRole)) {
      return true;
    }

    throw new UnauthorizedError();
  }
}
