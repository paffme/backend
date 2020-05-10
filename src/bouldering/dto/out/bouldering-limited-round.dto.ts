import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundState,
} from '../../round/bouldering-round.entity';
import { Competition } from '../../../competition/competition.entity';
import { Sex } from '../../../shared/types/sex.enum';
import { CategoryName } from '../../../shared/types/category-name.enum';

export class BoulderingLimitedRoundDto {
  @ApiProperty({
    type: Number,
  })
  readonly id!: typeof BoulderingRound.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly name!: typeof BoulderingRound.prototype.name;

  @ApiProperty({
    type: Number,
  })
  readonly index!: typeof BoulderingRound.prototype.index;

  @ApiProperty({
    type: Number,
  })
  readonly quota!: typeof BoulderingRound.prototype.quota;

  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: typeof BoulderingRound.prototype.type;

  @ApiProperty({ enum: Sex })
  readonly sex!: Sex;

  @ApiProperty({ enum: CategoryName })
  readonly category!: CategoryName;

  @ApiProperty({
    enum: BoulderingRoundState,
  })
  readonly state!: BoulderingRoundState;

  @ApiPropertyOptional({
    type: Number,
  })
  readonly maxTries!: typeof BoulderingRound.prototype.maxTries;
}
