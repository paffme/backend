import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class RegistrationNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Registration not found');
  }

  code = 'REGISTRATION_NOT_FOUND';
}
