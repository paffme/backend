import { Injectable } from '@nestjs/common';
import { BoulderingRound } from '../round/bouldering-round.entity';
import { getExAequoClimbers, handleExAequosRankings } from './ranking.utils';
import { RankingsMap } from '../types/rankings-map';
import { CompetitionRoundTypeOrdering } from '../../competition/competition-round-type.enum';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

@Injectable()
export class BoulderingRankingService {
  private handleExAequos(
    rankings: RankingsMap,
    groupRankings: RankingsMap,
  ): number {
    const exAequosClimbers = getExAequoClimbers(rankings);

    for (const exAequos of exAequosClimbers) {
      for (let i = 0; i < exAequos.length; i++) {
        const climberA = exAequos[i];

        for (let j = i + 1; j < exAequos.length; j++) {
          const climberB = exAequos[j];

          const climberARoundRanking = groupRankings.get(climberA)!;
          const climberBRoundRanking = groupRankings.get(climberB)!;

          if (climberARoundRanking > climberBRoundRanking) {
            rankings.set(climberA, rankings.get(climberA)! + 1);
          } else if (climberARoundRanking < climberBRoundRanking) {
            rankings.set(climberB, rankings.get(climberB)! + 1);
          }
        }
      }
    }

    return exAequosClimbers.length;
  }

  private getRoundRankingsMap(round: BoulderingRound): RankingsMap {
    const roundRankingsMap: RankingsMap = new Map();

    if (typeof round.rankings === 'undefined') {
      return roundRankingsMap;
    }

    for (const ranking of round.rankings.rankings) {
      roundRankingsMap.set(ranking.climber.id, ranking.ranking);
    }

    const entries = Array.from(roundRankingsMap).sort((a, b) => a[1] - b[1]);

    return handleExAequosRankings(
      entries,
      (resultA, resultB) => resultA[1] === resultB[1],
    );
  }

  getRankings(rounds: BoulderingRound[]): RankingsMap {
    const rankings: RankingsMap = new Map();

    if (rounds.length === 0) {
      return new Map();
    }

    const sortedRoundsByReverseOrder = rounds.sort(
      (a, b) =>
        CompetitionRoundTypeOrdering[b.type] -
        CompetitionRoundTypeOrdering[a.type],
    );

    const climbers = sortedRoundsByReverseOrder[
      sortedRoundsByReverseOrder.length - 1
    ].groups
      .getItems()
      .reduce((count, g) => count + g.climbers.count(), 0);

    for (const round of sortedRoundsByReverseOrder) {
      if (!round.rankings) {
        continue;
      }

      const roundRankingsMap = this.getRoundRankingsMap(round);

      // Handle ex-aequos from the previous round thanks to the current round rankings
      if (round.groups.count() === 1) {
        const computedExAequos = this.handleExAequos(
          rankings,
          roundRankingsMap,
        );

        if (computedExAequos === 0 && rankings.size === climbers) {
          // rankings will no more change
          break;
        }
      }

      // Add climber ranking if not yet inserted
      for (const [climberId, ranking] of roundRankingsMap) {
        if (rankings.has(climberId)) {
          continue;
        }

        rankings.set(climberId, ranking);
      }
    }

    return rankings;
  }
}
