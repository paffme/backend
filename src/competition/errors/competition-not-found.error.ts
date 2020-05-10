import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class CompetitionNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Competition not found');
  }

  code = 'COMPETITION_NOT_FOUND';
}
