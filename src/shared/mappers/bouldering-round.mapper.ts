import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingRoundDto } from '../../bouldering/dto/out/bouldering-round.dto';
import { BoulderingRound } from '../../bouldering/bouldering-round.entity';

@Injectable()
export class BoulderingRoundMapper extends BaseMapper<
  BoulderingRoundDto,
  BoulderingRound
> {
  constructor() {
    super({
      name: 'name',
    });
  }

  public map(round: BoulderingRound): BoulderingRoundDto {
    return morphism(this.schema, round);
  }

  public mapArray(rounds: BoulderingRound[]): BoulderingRoundDto[] {
    return rounds.map((r) => this.map(r));
  }
}
