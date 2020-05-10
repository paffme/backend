import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class MaxClimbersReachedError extends BadRequestException
  implements BaseError {
  constructor() {
    super('This round cannot take new climbers');
  }

  code = 'MAX_CLIMBERS_REACHED';
}
