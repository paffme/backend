import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class IncoherentZoneInTriesError extends UnprocessableEntityException
  implements BaseError {
  constructor(message: string) {
    super(message);
  }

  code = 'INCOHERENT_ZONE_IN_TRIES';
}
