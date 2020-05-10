import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class MaxTriesReachedError extends UnprocessableEntityException
  implements BaseError {
  constructor() {
    super('maxTries reached');
  }

  code = 'MAX_TRIES_REACHED';
}
