import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingLimitedContestRanking } from '../../bouldering/group/bouldering-group.entity';
import { ClimberRankingInfosMapper } from './climber-ranking-infos.mapper';
import { BoulderingLimitedContestRankingDto } from '../../bouldering/dto/out/bouldering-limited-contest-ranking.dto';

@Injectable()
export class BoulderingLimitedContestRankingMapper extends BaseMapper<
  BoulderingLimitedContestRankingDto,
  BoulderingLimitedContestRanking
> {
  constructor(
    private readonly climberRankingInfosMapper: ClimberRankingInfosMapper,
  ) {
    super({
      tops: 'tops',
      topsInTries: 'topsInTries',
      zones: 'zones',
      zonesInTries: 'zonesInTries',
      ranking: 'ranking',
      climber: (ranking) => this.climberRankingInfosMapper.map(ranking.climber),
    });
  }

  public map(
    ranking: BoulderingLimitedContestRanking,
  ): BoulderingLimitedContestRankingDto {
    return morphism(this.schema, ranking);
  }

  public mapArray(
    rankings: BoulderingLimitedContestRanking[],
  ): BoulderingLimitedContestRankingDto[] {
    return rankings.map((r) => this.map(r));
  }
}
