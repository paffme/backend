import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingRoundDto } from '../../bouldering/dto/out/bouldering-round.dto';
import { BoulderingRound } from '../../bouldering/round/bouldering-round.entity';
import { BoulderingGroupMapper } from './bouldering-group.mapper';

@Injectable()
export class BoulderingRoundMapper extends BaseMapper<
  BoulderingRoundDto,
  BoulderingRound
> {
  constructor(groupMapper: BoulderingGroupMapper) {
    super({
      id: 'id',
      name: 'name',
      quota: 'quota',
      type: 'type',
      rankingType: 'rankingType',
      competitionId: 'competition.id',
      category: 'category',
      sex: 'sex',
      groups: (round) => groupMapper.mapArray(round.groups.getItems()),
      maxTries: 'maxTries',
      state: 'state',
    });
  }

  public map(round: BoulderingRound): BoulderingRoundDto {
    return morphism(this.schema, round);
  }

  public mapArray(rounds: BoulderingRound[]): BoulderingRoundDto[] {
    return rounds.map((r) => this.map(r));
  }
}
