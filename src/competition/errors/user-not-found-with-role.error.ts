import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class UserNotFoundWithRoleError extends NotFoundException
  implements BaseError {
  constructor(role: string) {
    super(`User does not have the role ${role}`);
  }

  code = 'USER_NOT_FOUND_WITH_ROLE';
}
