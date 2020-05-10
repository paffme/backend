import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class InvalidRoundError extends UnprocessableEntityException
  implements BaseError {
  constructor(message: string) {
    super(message);
  }

  readonly code = 'INVALID_ROUND';
}
