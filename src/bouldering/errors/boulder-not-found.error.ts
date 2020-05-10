import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class BoulderNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Boulder not found');
  }

  code = 'BOULDER_NOT_FOUND';
}
