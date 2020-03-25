import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '../../user/user-role.enum';
import { User } from '../../user/user.entity';

@Injectable()
export class SystemRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
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

    throw new HttpException(
      'You do not have permission (AllowedSystemRoles)',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
