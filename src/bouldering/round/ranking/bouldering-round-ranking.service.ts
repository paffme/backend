import type {
  BoulderingRoundRankings,
  BoulderingRound,
} from '../bouldering-round.entity';

export interface BoulderingRoundRankingService {
  getRankings(round: BoulderingRound): BoulderingRoundRankings;
}
