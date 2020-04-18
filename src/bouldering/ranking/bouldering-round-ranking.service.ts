import type {
  BoulderingRoundRankings,
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../round/bouldering-round.entity';

export interface BoulderingRoundRankingService {
  readonly rankingType: BoulderingRoundRankingType;
  getRankings(round: BoulderingRound): Promise<BoulderingRoundRankings>;
}
