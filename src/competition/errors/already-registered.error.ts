import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class AlreadyRegisteredError extends ConflictException
  implements BaseError {
  constructor() {
    super('Already registered');
  }

  code = 'ALREADY_REGISTERED';
}
