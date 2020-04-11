import { User } from '../user/user.entity';
import { BaseRound } from './base-round';

export interface BaseResult<ResultType> {
  climber: User;
  round: BaseRound<ResultType>;
}
