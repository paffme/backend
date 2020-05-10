import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class RankingsNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Rankings not found');
  }

  code = 'RANKINGS_NOT_FOUND';
}
