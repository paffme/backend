import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { UnlimitedContestRankingDto } from './unlimited-contest-ranking.dto';
import { LimitedContestRankingDto } from './limited-contest-ranking.dto';
import { CircuitContestRankingDto } from './circuit-contest-ranking.dto';

type RankingData =
  | UnlimitedContestRankingDto
  | LimitedContestRankingDto
  | CircuitContestRankingDto;

@ApiExtraModels(
  UnlimitedContestRankingDto,
  LimitedContestRankingDto,
  CircuitContestRankingDto,
)
export class BoulderingRoundRankingsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
    type: 'array',
    oneOf: [
      {
        $ref: getSchemaPath(UnlimitedContestRankingDto),
      },
      {
        $ref: getSchemaPath(LimitedContestRankingDto),
      },
      {
        $ref: getSchemaPath(CircuitContestRankingDto),
      },
    ],
  })
  readonly data!: RankingData[];
}
