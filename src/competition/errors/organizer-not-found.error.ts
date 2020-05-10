import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class OrganizerNotFoundError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Organizer not found');
  }

  code = 'ORGANIZER_NOT_FOUND';
}
