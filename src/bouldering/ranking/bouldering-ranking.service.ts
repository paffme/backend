import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { User } from '../../user/user.entity';
import {
  BaseBoulderingRoundRanking,
  BoulderingRound,
} from '../round/bouldering-round.entity';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

type RankingsMap = Map<typeof User.prototype.id, number>;

@Injectable()
export class BoulderingRankingService {
  private getExAequoClimbers(
    rankings: RankingsMap,
  ): typeof User.prototype.id[][] {
    const exAequoClimbers = [];
    const entries = Array.from(rankings);

    for (let i = 0; i < rankings.size; i++) {
      const [climberIdA, climberRankingA] = entries[i];
      const tmp = new Set<typeof User.prototype.id>();

      for (let j = i + 1; j < rankings.size; j++) {
        const [climberIdB, climberRankingB] = entries[j];

        if (climberRankingA === climberRankingB) {
          tmp.add(climberIdA);
          tmp.add(climberIdB);
        }
      }

      if (tmp.size > 0) {
        exAequoClimbers.push([...tmp]);
      }
    }

    return exAequoClimbers;
  }

  private getClimberRankingInRound(
    round: BoulderingRound,
    climberId: typeof User.prototype.id,
  ): number {
    // find is not available with type checking
    // because of a lack of support in union types within Typescript
    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-3.html#caveats
    const index = round.rankings!.rankings.findIndex(
      (r: Pick<BaseBoulderingRoundRanking, 'climberId'>) =>
        r.climberId === climberId,
    );

    return round.rankings!.rankings[index].ranking;
  }

  getRankings(rounds: BoulderingRound[]): RankingsMap {
    const rankings: RankingsMap = new Map();
    const sortedRoundsByReverseIndex = rounds.sort((a, b) => b.index - a.index);
    const climbers = sortedRoundsByReverseIndex[
      sortedRoundsByReverseIndex.length - 1
    ].climbers.count();

    for (const round of sortedRoundsByReverseIndex) {
      if (!round.rankings) {
        continue;
      }

      // Handle all ex-aequos from the previous round
      const exAequosClimbers = this.getExAequoClimbers(rankings);

      if (exAequosClimbers.length === 0 && rankings.size === climbers) {
        // rankings will no more change anymore
        break;
      }

      for (const exAequos of exAequosClimbers) {
        for (let i = 0; i < exAequos.length; i++) {
          const climberA = exAequos[i];

          for (let j = i + 1; j < exAequos.length; j++) {
            const climberB = exAequos[j];

            const climberARoundRanking = this.getClimberRankingInRound(
              round,
              climberA,
            );

            const climberBRoundRanking = this.getClimberRankingInRound(
              round,
              climberB,
            );

            if (climberARoundRanking > climberBRoundRanking) {
              rankings.set(climberA, rankings.get(climberA)! + 1);
            } else if (climberARoundRanking < climberBRoundRanking) {
              rankings.set(climberB, rankings.get(climberB)! + 1);
            }
          }
        }
      }

      // Add climber ranking if not yet inserted
      for (const { climberId, ranking } of round.rankings.rankings) {
        if (rankings.has(climberId)) {
          continue;
        }

        rankings.set(climberId, ranking);
      }
    }

    return rankings;
  }
}
