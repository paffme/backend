import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { RankingDto } from '../../competition/dto/out/ranking.dto';
import { Ranking } from '../../competition/competition.entity';

@Injectable()
export class RankingMapper extends BaseMapper<RankingDto, Ranking> {
  constructor() {
    super({
      ranking: 'ranking',
      climber: 'climber',
    });
  }

  public map(ranking: Ranking): RankingDto {
    return morphism(this.schema, ranking);
  }

  public mapArray(rankings: Ranking[]): RankingDto[] {
    return rankings.map((r) => this.map(r));
  }
}
