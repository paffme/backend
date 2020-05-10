import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class InvalidCredentialsError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Invalid credentials');
  }

  code = 'INVALID_CREDENTIALS';
}
