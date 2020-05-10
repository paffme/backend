import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class UserNotFoundError extends NotFoundException implements BaseError {
  constructor() {
    super('User not found');
  }

  code = 'USER_NOT_FOUND';
}
