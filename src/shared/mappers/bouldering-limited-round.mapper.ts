import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingRound } from '../../bouldering/round/bouldering-round.entity';
import { BoulderingLimitedRoundDto } from '../../bouldering/dto/out/bouldering-limited-round.dto';

@Injectable()
export class BoulderingLimitedRoundMapper extends BaseMapper<
  BoulderingLimitedRoundDto,
  BoulderingRound
> {
  constructor() {
    super({
      id: 'id',
      name: 'name',
      index: 'index',
      quota: 'quota',
      type: 'type',
      competitionId: 'competition.id',
      category: 'category',
      sex: 'sex',
      maxTries: 'maxTries',
      state: 'state',
    });
  }

  public map(round: BoulderingRound): BoulderingLimitedRoundDto {
    return morphism(this.schema, round);
  }

  public mapArray(rounds: BoulderingRound[]): BoulderingLimitedRoundDto[] {
    return rounds.map((r) => this.map(r));
  }
}
