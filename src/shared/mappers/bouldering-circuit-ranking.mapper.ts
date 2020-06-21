import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingCircuitRanking } from '../../bouldering/group/bouldering-group.entity';
import { ClimberRankingInfosMapper } from './climber-ranking-infos.mapper';
import { BoulderingCircuitRankingDto } from '../../bouldering/dto/out/bouldering-circuit-ranking.dto';

@Injectable()
export class BoulderingCircuitRankingMapper extends BaseMapper<
  BoulderingCircuitRankingDto,
  BoulderingCircuitRanking
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

  public map(ranking: BoulderingCircuitRanking): BoulderingCircuitRankingDto {
    return morphism(this.schema, ranking);
  }

  public mapArray(
    rankings: BoulderingCircuitRanking[],
  ): BoulderingCircuitRankingDto[] {
    return rankings.map((r) => this.map(r));
  }
}
