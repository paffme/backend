import { User } from '../../../user/user.entity';
import { BoulderingRound } from '../../round/bouldering-round.entity';
import { Boulder } from '../../boulder/boulder.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoulderingResult } from '../../result/bouldering-result.entity';
import { Competition } from '../../../competition/competition.entity';

export class BoulderingResultDto {
  @ApiProperty({
    type: Number,
  })
  id!: typeof BoulderingResult.prototype.id;

  @ApiProperty({
    type: Number,
  })
  climberId!: typeof User.prototype.id;

  @ApiProperty({
    type: Number,
  })
  competitionId!: typeof Competition.prototype.id;

  @ApiProperty({
    type: Number,
  })
  roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty({
    type: Number,
  })
  boulderId!: typeof Boulder.prototype.id;

  @ApiProperty({
    type: Boolean,
  })
  top!: typeof BoulderingResult.prototype.top;

  @ApiPropertyOptional({
    type: Number,
  })
  topInTries?: typeof BoulderingResult.prototype.topInTries;

  @ApiPropertyOptional({
    type: Boolean,
  })
  zone?: typeof BoulderingResult.prototype.zone;

  @ApiPropertyOptional({
    type: Number,
  })
  zoneInTries?: typeof BoulderingResult.prototype.zoneInTries;

  @ApiPropertyOptional({
    type: Number,
  })
  tries?: typeof BoulderingResult.prototype.tries;
}
