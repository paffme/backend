import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingUnlimitedContestRankingMapper } from './bouldering-unlimited-contest-ranking.mapper';
import { BoulderingLimitedContestRankingMapper } from './bouldering-limited-contest-ranking.mapper';
import { BoulderingCircuitRankingMapper } from './bouldering-circuit-ranking.mapper';

import {
  BoulderingRoundRankings,
  BoulderingRoundRankingType,
} from '../../bouldering/round/bouldering-round.entity';

import {
  BoulderingRoundRankingsDto,
  RankingDataDto,
} from '../../bouldering/dto/out/bouldering-round-rankings.dto';

@Injectable()
export class BoulderingRoundRankingsMapper extends BaseMapper<
  BoulderingRoundRankingsDto,
  BoulderingRoundRankings
> {
  constructor(
    private readonly boulderingUnlimitedContestRankingMapper: BoulderingUnlimitedContestRankingMapper,
    private readonly boulderingLimitedContestRankingMapper: BoulderingLimitedContestRankingMapper,
    private readonly boulderingCircuitRankingMapper: BoulderingCircuitRankingMapper,
  ) {
    super({
      type: 'type',
      data: (roundRankings): RankingDataDto[] => {
        if (
          roundRankings.type === BoulderingRoundRankingType.UNLIMITED_CONTEST
        ) {
          return this.boulderingUnlimitedContestRankingMapper.mapArray(
            roundRankings.rankings,
          );
        }

        if (roundRankings.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
          return this.boulderingLimitedContestRankingMapper.mapArray(
            roundRankings.rankings,
          );
        }

        if (roundRankings.type === BoulderingRoundRankingType.CIRCUIT) {
          return this.boulderingCircuitRankingMapper.mapArray(
            roundRankings.rankings,
          );
        }

        throw new NotImplementedException('Unhandled ranking type');
      },
    });
  }

  public map(rankings: BoulderingRoundRankings): BoulderingRoundRankingsDto {
    return morphism(this.schema, rankings);
  }

  public mapArray(
    rankings: BoulderingRoundRankings[],
  ): BoulderingRoundRankingsDto[] {
    return rankings.map((r) => this.map(r));
  }
}
