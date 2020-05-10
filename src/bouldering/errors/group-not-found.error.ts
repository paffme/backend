import { NotFoundException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class GroupNotFoundError extends NotFoundException implements BaseError {
  constructor() {
    super('Group not found');
  }

  code = 'GROUP_NOT_FOUND';
}
