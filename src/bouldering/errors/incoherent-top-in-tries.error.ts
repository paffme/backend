import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class IncoherentTopInTriesError extends UnprocessableEntityException
  implements BaseError {
  constructor(message: string) {
    super(message);
  }

  code = 'INCOHERENT_TOP_IN_TRIES';
}
