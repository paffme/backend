import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../../../competition.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BoulderingRound } from '../../../../bouldering/round/bouldering-round.entity';

export class GetBoulderingGroupsParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly roundId!: typeof BoulderingRound.prototype.id;
}
