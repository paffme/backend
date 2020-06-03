import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import { User } from '../../user/user.entity';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { BaseGroup } from '../../competition/base-group';
import { BaseEntity } from '../../shared/base.entity';
import { Boulder } from '../boulder/boulder.entity';
import { BoulderingResult } from '../result/bouldering-result.entity';

export enum BoulderingGroupState {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

@Entity()
export class BoulderingGroup extends BaseEntity
  implements BaseGroup<BoulderingRound> {
  @Property()
  name: string;

  @ManyToMany(() => User)
  climbers: Collection<User> = new Collection<User>(this);

  @OneToMany(() => Boulder, (boulder) => boulder.group, {
    orphanRemoval: true,
  })
  boulders: Collection<Boulder> = new Collection<Boulder>(this);

  // This will store all results for all the user in this round
  @OneToMany(
    () => BoulderingResult,
    (boulderingResult) => boulderingResult.group,
    {
      orphanRemoval: true,
    },
  )
  results: Collection<BoulderingResult> = new Collection<BoulderingResult>(
    this,
  );

  @ManyToOne()
  round: BoulderingRound;

  @Enum(() => BoulderingGroupState)
  state: BoulderingGroupState = BoulderingGroupState.PENDING;

  constructor(name: string, round: BoulderingRound) {
    super();
    this.name = name;
    this.round = round;
  }
}
