import type {
  BoulderingGroup,
  BoulderingGroupRankings,
} from '../bouldering-group.entity';

export interface BoulderingGroupRankingService {
  getRankings(group: BoulderingGroup): BoulderingGroupRankings;
}
