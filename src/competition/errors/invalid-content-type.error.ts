import { NotAcceptableException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class InvalidContentTypeError extends NotAcceptableException
  implements BaseError {
  constructor() {
    super('Invalid content type');
  }

  code = 'INVALID_CONTENT_TYPE';
}
