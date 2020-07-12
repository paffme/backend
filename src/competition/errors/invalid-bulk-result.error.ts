import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class InvalidBulkResultError extends UnprocessableEntityException
  implements BaseError {
  constructor(message: string) {
    super(message);
  }

  code = 'INVALID_BULK_RESULT';
}
