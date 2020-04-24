import { User } from '../user/user.entity';
import { BaseEntity } from '../shared/base.entity';
import { BaseGroup } from './base-group';

export interface BaseResult<RoundType> extends BaseEntity {
  climber: User;
  group: BaseGroup<RoundType>;
}
