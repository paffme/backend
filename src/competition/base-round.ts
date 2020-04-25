import { Competition } from './competition.entity';
import { Collection } from 'mikro-orm';
import { BaseEntity } from '../shared/base.entity';

export interface BaseRound<GroupType> extends BaseEntity {
  name: string;
  quota: number;
  rankingType: string;
  started: boolean;
  competition: Competition;
  groups: Collection<GroupType>;
}
