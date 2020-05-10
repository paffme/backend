import { UnprocessableEntityException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';

export class WrongResultForRoundError extends UnprocessableEntityException
  implements BaseError {
  constructor(message: string) {
    super(message);
  }

  code = 'WRONG_RESULT_FOR_ROUND';
}
