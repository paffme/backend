import { BaseEntity } from '../../shared/base.entity';
import { Entity, ManyToOne, Property } from 'mikro-orm';
import { BoulderingRound } from '../round/bouldering-round.entity';

@Entity()
export class Boulder extends BaseEntity {
  @ManyToOne()
  round: BoulderingRound;

  @Property()
  index: number;

  constructor(round: BoulderingRound, index: number) {
    super();
    this.round = round;
    this.index = index;
  }
}
