import type {
  BoulderingRoundRankings,
  BoulderingRound,
} from '../round/bouldering-round.entity';

export interface BoulderingRoundRankingService {
  getRankings(round: BoulderingRound): Promise<BoulderingRoundRankings>;
}
