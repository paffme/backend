import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class RegistrationsClosedError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Registrations for this competition are closed.');
  }

  code = 'REGISTRATIONS_CLOSED';
}
