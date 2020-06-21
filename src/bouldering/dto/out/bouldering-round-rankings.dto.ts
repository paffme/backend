import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { BoulderingUnlimitedContestRankingDto } from './bouldering-unlimited-contest-ranking.dto';
import { BoulderingLimitedContestRankingDto } from './bouldering-limited-contest-ranking.dto';
import { BoulderingCircuitRankingDto } from './bouldering-circuit-ranking.dto';

export type RankingDataDto =
  | BoulderingUnlimitedContestRankingDto
  | BoulderingLimitedContestRankingDto
  | BoulderingCircuitRankingDto;

@ApiExtraModels(
  BoulderingUnlimitedContestRankingDto,
  BoulderingLimitedContestRankingDto,
  BoulderingCircuitRankingDto,
)
export class BoulderingRoundRankingsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
    type: 'array',
    oneOf: [
      {
        $ref: getSchemaPath(BoulderingUnlimitedContestRankingDto),
      },
      {
        $ref: getSchemaPath(BoulderingLimitedContestRankingDto),
      },
      {
        $ref: getSchemaPath(BoulderingCircuitRankingDto),
      },
    ],
  })
  readonly data!: RankingDataDto[];
}
