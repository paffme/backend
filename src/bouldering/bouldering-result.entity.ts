import { BaseResult } from '../competition/base-result';
import { Entity, ManyToOne, Property } from 'mikro-orm';
import { BoulderingRound } from './bouldering-round.entity';
import { User } from '../user/user.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity()
// TODO : Refactor into multiple class to handle multiple bouldering result types when discriminator is available in MikroORM
export class BoulderingResult extends BaseEntity
  implements BaseResult<BoulderingResult> {
  @ManyToOne()
  climber: User;

  @ManyToOne()
  round: BoulderingRound;

  @Property()
  tops: boolean[];

  @Property()
  topInTries: number[];

  @Property()
  zones: boolean[];

  @Property()
  zoneInTries: number[];

  constructor(climber: User, round: BoulderingRound, boulders: number) {
    super();
    this.climber = climber;
    this.round = round;
    this.tops = new Array(boulders).fill(false);
    this.topInTries = new Array(boulders).fill(0);
    this.zones = new Array(boulders).fill(false);
    this.zoneInTries = new Array(boulders).fill(0);
  }
}
