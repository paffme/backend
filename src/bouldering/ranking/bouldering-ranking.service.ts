import { Injectable } from '@nestjs/common';
import { User } from '../../user/user.entity';

import {
  BoulderingRound,
  BoulderingRoundType,
} from '../round/bouldering-round.entity';

type RankingsMap = Map<typeof User.prototype.id, number>;

@Injectable()
export class BoulderingRankingService {
  getRankings(rounds: BoulderingRound[]): RankingsMap {
    const rankings: RankingsMap = new Map();

    const qualifier = rounds.find(
      (r) => r.type === BoulderingRoundType.QUALIFIER,
    );

    const semiFinal = rounds.find(
      (r) => r.type === BoulderingRoundType.SEMI_FINAL,
    );

    const final = rounds.find((r) => r.type === BoulderingRoundType.FINAL);

    if (final && final.rankings) {
      for (const r of final.rankings.rankings) {
        rankings.set(r.climberId, r.ranking);
      }
    }

    if (semiFinal && semiFinal.rankings) {
      for (const r of semiFinal.rankings.rankings) {
        if (!rankings.has(r.climberId)) {
          rankings.set(r.climberId, r.ranking);
        }
      }
    }

    if (qualifier && qualifier.rankings) {
      for (const r of qualifier.rankings.rankings) {
        if (!rankings.has(r.climberId)) {
          rankings.set(r.climberId, r.ranking);
        }
      }
    }

    // TODO : handle ex aequos :)

    return rankings;
  }
}
