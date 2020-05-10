import { ConflictException } from '@nestjs/common';
import { BaseError } from '../../shared/errors/base.error';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';

export class RoundTypeConflictError extends ConflictException
  implements BaseError {
  constructor(type: CompetitionRoundType) {
    super(`Round with type ${type} already exists.`);
  }

  code = 'ROUND_TYPE_CONFLICT';
}
