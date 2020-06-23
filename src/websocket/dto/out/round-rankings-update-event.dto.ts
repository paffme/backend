import { RankingsDiff } from '../../../bouldering/ranking/ranking.utils';
import { BoulderingRound } from '../../../bouldering/round/bouldering-round.entity';
import { BoulderingRoundRankingsUpdateEventPayload } from '../../../bouldering/round/bouldering-round.service';

export class RoundRankingsUpdateEventDto {
  roundId: typeof BoulderingRound.prototype.id;
  rankings: typeof BoulderingRound.prototype.rankings;
  diff: RankingsDiff[];

  constructor(payload: BoulderingRoundRankingsUpdateEventPayload) {
    this.roundId = payload.roundId;
    this.rankings = payload.rankings;
    this.diff = payload.diff;
  }
}
