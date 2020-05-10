import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class InvalidResultError extends UnprocessableEntityException
  implements BaseError {
  constructor() {
    super(
      'At least one element in the body is required among try, zone and top',
    );
  }

  code = 'INVALID_RESULT';
}
