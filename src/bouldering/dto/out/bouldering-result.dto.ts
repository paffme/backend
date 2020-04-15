import { User } from '../../../user/user.entity';
import { BoulderingRound } from '../../bouldering-round.entity';
import { Boulder } from '../../boulder.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoulderingResult } from '../../bouldering-result.entity';
import { Competition } from '../../../competition/competition.entity';

export class BoulderingResultDto {
  @ApiProperty()
  id!: typeof BoulderingResult.prototype.id;

  @ApiProperty()
  climberId!: typeof User.prototype.id;

  @ApiProperty()
  competitionId!: typeof Competition.prototype.id;

  @ApiProperty()
  roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty()
  boulderId!: typeof Boulder.prototype.id;

  @ApiProperty()
  top!: boolean;

  @ApiPropertyOptional()
  topInTries?: number;

  @ApiPropertyOptional()
  zone?: boolean;

  @ApiPropertyOptional()
  zoneInTries?: number;

  @ApiPropertyOptional()
  tries?: number;
}
