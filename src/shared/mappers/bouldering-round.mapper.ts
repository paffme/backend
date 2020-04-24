import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingRoundDto } from '../../bouldering/dto/out/bouldering-round.dto';
import { BoulderingRound } from '../../bouldering/round/bouldering-round.entity';
import { BoulderMapper } from './boulder.mapper';

@Injectable()
export class BoulderingRoundMapper extends BaseMapper<
  BoulderingRoundDto,
  BoulderingRound
> {
  constructor(boulderMapper: BoulderMapper) {
    super({
      id: 'id',
      name: 'name',
      index: 'index',
      quota: 'quota',
      type: 'type',
      competitionId: 'competition.id',
      category: 'category',
      sex: 'sex',
      boulders: (round) => boulderMapper.mapArray(round.boulders.getItems()),
    });
  }

  public map(round: BoulderingRound): BoulderingRoundDto {
    return morphism(this.schema, round);
  }

  public mapArray(rounds: BoulderingRound[]): BoulderingRoundDto[] {
    return rounds.map((r) => this.map(r));
  }
}
