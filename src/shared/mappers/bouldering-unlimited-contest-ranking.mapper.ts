import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingUnlimitedContestRankingDto } from '../../bouldering/dto/out/bouldering-unlimited-contest-ranking.dto';
import { BoulderingUnlimitedContestRanking } from '../../bouldering/group/bouldering-group.entity';
import { ClimberRankingInfosMapper } from './climber-ranking-infos.mapper';

@Injectable()
export class BoulderingUnlimitedContestRankingMapper extends BaseMapper<
  BoulderingUnlimitedContestRankingDto,
  BoulderingUnlimitedContestRanking
> {
  constructor(
    private readonly climberRankingInfosMapper: ClimberRankingInfosMapper,
  ) {
    super({
      tops: 'tops',
      nbTops: 'nbTops',
      points: 'points',
      ranking: 'ranking',
      climber: (ranking) => this.climberRankingInfosMapper.map(ranking.climber),
    });
  }

  public map(
    ranking: BoulderingUnlimitedContestRanking,
  ): BoulderingUnlimitedContestRankingDto {
    return morphism(this.schema, ranking);
  }

  public mapArray(
    rankings: BoulderingUnlimitedContestRanking[],
  ): BoulderingUnlimitedContestRankingDto[] {
    return rankings.map((r) => this.map(r));
  }
}
