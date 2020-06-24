import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class BoulderingResultNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Bouldering result not found');
  }

  code = 'BOULDERING_RESULT_NOT_FOUND';
}
