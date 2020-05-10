import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class RoundNotFoundError extends NotFoundException implements BaseError {
  constructor() {
    super('Round not found');
  }

  code = 'ROUND_NOT_FOUND';
}
