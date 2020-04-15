import { Competition } from './competition.entity';
import { Collection } from 'mikro-orm';
import { User } from '../user/user.entity';

export interface BaseRound<ResultType> {
  name: string;
  quota: number;
  rankingType: string;
  started: boolean;
  competition: Competition;
  climbers: Collection<User>;
  results: Collection<ResultType>;
}
