import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class JudgeNotAssignedError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Judge is not judging this boulder');
  }

  code = 'JUDGE_NOT_ASSIGNED';
}
