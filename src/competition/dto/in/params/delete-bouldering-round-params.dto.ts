import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Competition } from '../../../competition.entity';
import { BoulderingRound } from '../../../../bouldering/round/bouldering-round.entity';

export class DeleteBoulderingRoundParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly roundId!: typeof BoulderingRound.prototype.id;
}
