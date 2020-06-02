import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class NoPreviousRoundRankingsError extends BadRequestException
  implements BaseError {
  constructor() {
    super('No rankings in the previous round');
  }

  code = 'NO_PREVIOUS_ROUND_RANKINGS';
}
