import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../competition.entity';

export class RegisterParamsDto {
  @Type(() => Number)
  @IsInt()
  readonly competitionId: typeof Competition.prototype.id;
}
