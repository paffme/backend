import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class UserAlreadyHasRoleError extends ConflictException
  implements BaseError {
  constructor(role: string) {
    super(`User already have the role ${role}`);
  }

  code = 'USER_ALREADY_HAS_ROLE';
}
