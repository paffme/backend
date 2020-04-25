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
  readonly id!: typeof BoulderingResult.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly climberId!: typeof User.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly boulderId!: typeof Boulder.prototype.id;

  @ApiProperty({
    type: Boolean,
  })
  readonly top!: typeof BoulderingResult.prototype.top;

  @ApiPropertyOptional({
    type: Number,
  })
  readonly topInTries?: typeof BoulderingResult.prototype.topInTries;

  @ApiPropertyOptional({
    type: Boolean,
  })
  readonly zone?: typeof BoulderingResult.prototype.zone;

  @ApiPropertyOptional({
    type: Number,
  })
  readonly zoneInTries?: typeof BoulderingResult.prototype.zoneInTries;

  @ApiPropertyOptional({
    type: Number,
  })
  readonly tries?: typeof BoulderingResult.prototype.tries;
}
