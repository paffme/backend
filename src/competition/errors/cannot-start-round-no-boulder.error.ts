import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class CannotStartRoundNoBoulderError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Cannot start this round because a group have zero boulder');
  }

  code = 'CANNOT_START_ROUND_NO_BOULDER_ERROR';
}
