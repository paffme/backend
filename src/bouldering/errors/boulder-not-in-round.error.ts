import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class BoulderNotInRoundError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Boulder not in round');
  }

  code = 'BOULDER_NOT_IN_ROUND';
}
