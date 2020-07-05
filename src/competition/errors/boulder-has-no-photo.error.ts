import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class BoulderHasNoPhotoError extends NotFoundException
  implements BaseError {
  constructor() {
    super('Boulder has no photo');
  }

  code = 'BOULDER_HAS_NO_PHOTO';
}
