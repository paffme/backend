import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class GroupNameConflictError extends ConflictException
  implements BaseError {
  constructor() {
    super('Group name already used');
  }

  code = 'GROUP_NAME_CONFLICT';
}
