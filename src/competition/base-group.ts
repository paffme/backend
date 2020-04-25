import { Collection } from 'mikro-orm';
import { User } from '../user/user.entity';
import { BaseEntity } from '../shared/base.entity';

export interface BaseGroup<RoundType> extends BaseEntity {
  name: string;
  climbers: Collection<User>;
  round: RoundType;
}
