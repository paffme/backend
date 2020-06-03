import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class BoulderNotInGroupError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Boulder not in group');
  }

  code = 'BOULDER_NOT_IN_GROUP';
}
