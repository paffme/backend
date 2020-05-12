import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class AlreadyJudgingBoulderConflictError extends ConflictException
  implements BaseError {
  constructor() {
    super('Already judge of this boulder');
  }

  code = 'ALREADY_JUDGING_BOULDER_CONFLICT';
}
