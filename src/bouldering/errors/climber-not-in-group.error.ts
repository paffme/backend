import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class ClimberNotInGroupError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Climber not in group');
  }

  code = 'CLIMBER_NOT_IN_GROUP';
}
