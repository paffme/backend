import { BaseResult } from '../../competition/base-result';
import { Entity, ManyToOne, Property } from 'mikro-orm';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { User } from '../../user/user.entity';
import { BaseEntity } from '../../shared/base.entity';
import { Boulder } from '../boulder/boulder.entity';
import { BoulderingGroup } from '../group/bouldering-group.entity';

@Entity()
// TODO : Refactor into multiple class to handle multiple bouldering result types when discriminator is available in MikroORM
export class BoulderingResult extends BaseEntity
  implements BaseResult<BoulderingRound> {
  @ManyToOne()
  climber: User;

  @ManyToOne()
  group: BoulderingGroup;

  @ManyToOne()
  boulder: Boulder;

  @Property()
  top = false;

  @Property()
  topInTries = 0;

  @Property()
  zone = false;

  @Property()
  zoneInTries = 0;

  @Property()
  tries = 0;

  constructor(climber: User, group: BoulderingGroup, boulder: Boulder) {
    super();
    this.climber = climber;
    this.group = group;
    this.boulder = boulder;
  }
}
