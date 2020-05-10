import { ForbiddenException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class ClimberNotRegisteredError extends ForbiddenException
  implements BaseError {
  constructor() {
    super('Climber not registered');
  }

  code = 'CLIMBER_NOT_REGISTERED';
}
