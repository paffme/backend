import { BadRequestException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class AddResultWithoutOngoingGroupError extends BadRequestException
  implements BaseError {
  constructor() {
    super('Cannot add a result on a group that is not in the ongoing state');
  }

  code = 'ADD_RESULT_WITHOUT_ONGOING_GROUP';
}
