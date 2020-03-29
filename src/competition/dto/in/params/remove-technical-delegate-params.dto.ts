import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../../../competition.entity';
import { User } from '../../../../user/user.entity';

export class RemoveTechnicalDelegateParamsDto {
  @Type(() => Number)
  @IsInt()
  readonly competitionId: typeof Competition.prototype.id;

  @Type(() => Number)
  @IsInt()
  readonly userId: typeof User.prototype.id;
}
