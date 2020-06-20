import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { UnlimitedContestRankingDto } from './unlimited-contest-ranking.dto';
import { LimitedContestRankingDto } from './limited-contest-ranking.dto';
import { CircuitContestRankingDto } from './circuit-contest-ranking.dto';

export class UnlimitedContestGroupRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.UNLIMITED_CONTEST;

  @ApiProperty({ isArray: true, type: Number })
  bouldersPoints!: number[];

  @ApiProperty({ isArray: true, type: UnlimitedContestRankingDto })
  rankings!: UnlimitedContestRankingDto[];
}

export class LimitedContestGroupRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.LIMITED_CONTEST;

  @ApiProperty({ isArray: true, type: LimitedContestRankingDto })
  rankings!: LimitedContestRankingDto[];
}

export class CircuitGroupRankingsDto {
  @ApiProperty()
  type!: BoulderingRoundRankingType.CIRCUIT;

  @ApiProperty({ isArray: true, type: CircuitContestRankingDto })
  rankings!: CircuitContestRankingDto[];
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
