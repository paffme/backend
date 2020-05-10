import { UnauthorizedException } from '@nestjs/common';
import { BaseError } from '../errors/base.error';

export class UnauthorizedError extends UnauthorizedException
  implements BaseError {
  constructor() {
    super();
  }

  code = 'UNAUTHORIZED';
}
