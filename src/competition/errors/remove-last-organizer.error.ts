import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class RemoveLastOrganizerError extends BadRequestException
  implements BaseError {
  constructor() {
    super('The last organizer cannot be removed');
  }

  code = 'REMOVING_LAST_ORGANIZER';
}
