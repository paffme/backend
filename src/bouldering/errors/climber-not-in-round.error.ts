import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class ClimberNotInRoundError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Climber not in round');
  }

  code = 'CLIMBER_NOT_IN_ROUND';
}
