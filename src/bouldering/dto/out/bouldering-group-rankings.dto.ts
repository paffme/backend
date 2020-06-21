import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { BoulderingUnlimitedContestRankingDto } from './bouldering-unlimited-contest-ranking.dto';
import { BoulderingLimitedContestRankingDto } from './bouldering-limited-contest-ranking.dto';
import { BoulderingCircuitRankingDto } from './bouldering-circuit-ranking.dto';
import { Boulder } from '../../boulder/boulder.entity';

class BaseRankingsDto {
  @ApiProperty({ type: Number, isArray: true })
  boulders!: typeof Boulder.prototype.id[];
}

export class UnlimitedContestGroupRankingsDto extends BaseRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.UNLIMITED_CONTEST;

  @ApiProperty({ isArray: true, type: Number })
  bouldersPoints!: number[];

  @ApiProperty({ isArray: true, type: BoulderingUnlimitedContestRankingDto })
  rankings!: BoulderingUnlimitedContestRankingDto[];
}

export class LimitedContestGroupRankingsDto extends BaseRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.LIMITED_CONTEST;

  @ApiProperty({ isArray: true, type: BoulderingLimitedContestRankingDto })
  rankings!: BoulderingLimitedContestRankingDto[];
}

export class CircuitGroupRankingsDto extends BaseRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.CIRCUIT;

  @ApiProperty({ isArray: true, type: BoulderingCircuitRankingDto })
  rankings!: BoulderingCircuitRankingDto[];
}

export type RankingsDataDto =
  | UnlimitedContestGroupRankingsDto
  | LimitedContestGroupRankingsDto
  | CircuitGroupRankingsDto;

@ApiExtraModels(
  UnlimitedContestGroupRankingsDto,
  LimitedContestGroupRankingsDto,
  CircuitGroupRankingsDto,
)
export class BoulderingGroupRankingsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
    oneOf: [
      {
        $ref: getSchemaPath(UnlimitedContestGroupRankingsDto),
      },
      {
        $ref: getSchemaPath(LimitedContestGroupRankingsDto),
      },
      {
        $ref: getSchemaPath(CircuitGroupRankingsDto),
      },
    ],
  })
  readonly data!: RankingsDataDto;
}
