import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class EmailAlreadyUsedError extends ConflictException
  implements BaseError {
  constructor() {
    super('email already used');
  }

  code = 'EMAIL_ALREADY_USED';
}
