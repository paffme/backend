import { IsInt } from 'class-validator';
import { User } from '../../../user.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Competition } from '../../../../competition/competition.entity';

export class GetCompetitionJudgementsAssignmentsParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;
}
