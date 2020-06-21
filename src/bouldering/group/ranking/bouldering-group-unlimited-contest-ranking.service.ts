import { Injectable } from '@nestjs/common';
import { User } from '../../../user/user.entity';
import { BoulderingResult } from '../../result/bouldering-result.entity';
import { BoulderingGroupRankingService } from './bouldering-group-ranking.service';
import { RankingsMap } from '../../types/rankings-map';

import {
  BoulderingGroup,
  BoulderingUnlimitedContestRanking,
  BoulderingUnlimitedContestRankings,
} from '../bouldering-group.entity';

import { handleExAequosRankings } from '../../ranking/ranking.utils';
import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';

type AggregatedBoulderingUnlimitedResults = Pick<
  BoulderingUnlimitedContestRanking,
  'tops' | 'points'
>;

type AggregatedClimbersResultsEntry = [
  typeof User.prototype.id,
  AggregatedBoulderingUnlimitedResults,
];

type AggregatedClimbersResultsMap = Map<
  AggregatedClimbersResultsEntry[0],
  AggregatedClimbersResultsEntry[1]
>;

@Injectable()
export class BoulderingGroupUnlimitedContestRankingService
  implements BoulderingGroupRankingService {
  private getBouldersPoints(
    results: BoulderingResult[],
    boulders: number,
  ): number[] {
    const BOULDER_POINTS = 1000;

    return results
      .reduce<number[]>((bouldersTops, result) => {
        if (result.top) {
          bouldersTops[result.boulder.index]++;
        }

        return bouldersTops;
      }, new Array(boulders).fill(0))
      .map((boulderTops) => {
        if (boulderTops === 0) {
          return BOULDER_POINTS;
        }

        return Math.round((BOULDER_POINTS / boulderTops) * 1e2) / 1e2; // only keep 2 decimals
      });
  }

  private groupResultsByClimber(
    results: BoulderingResult[],
    bouldersPoints: number[],
    boulders: number,
  ): AggregatedClimbersResultsMap {
    return results.reduce<AggregatedClimbersResultsMap>((map, result) => {
      const boulderIndex = result.boulder.index;
      const aggregatedResults = map.get(result.climber.id) ?? {
        tops: new Array(boulders).fill(false),
        points: 0,
      };

      aggregatedResults.tops[boulderIndex] = result.top;

      if (result.top) {
        aggregatedResults.points += bouldersPoints[boulderIndex];
      }

      map.set(result.climber.id, aggregatedResults);
      return map;
    }, new Map());
  }

  private sortClimbersByPoints(
    entries: AggregatedClimbersResultsEntry[],
  ): typeof entries {
    return entries.sort(([, resultsA], [, resultsB]): number => {
      return resultsB.points - resultsA.points;
    });
  }

  private computeRankings(results: AggregatedClimbersResultsMap): RankingsMap {
    const entries = this.sortClimbersByPoints(Array.from(results));

    // Then handle ex-aequo and define final ranking
    return handleExAequosRankings(
      entries,
      (entryA, entryB) => Math.abs(entryA[1].points - entryB[1].points) < 0.01,
    );
  }

  getRankings(group: BoulderingGroup): BoulderingUnlimitedContestRankings {
    // Compute group ranking
    const bouldersCount = group.boulders.count();
    const results = group.results.getItems();
    const climbers = group.climbers.getItems();

    // First compute each boulder points
    const bouldersPoints = this.getBouldersPoints(results, bouldersCount);

    // Group results by climber and aggregate results
    const climbersResults = this.groupResultsByClimber(
      results,
      bouldersPoints,
      bouldersCount,
    );

    // Compute rankings
    const groupRankings = this.computeRankings(climbersResults);

    // Gather all information
    return {
      type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      bouldersPoints,
      boulders: group.boulders.getItems().map((b) => b.id),
      rankings: Array.from(
        groupRankings,
        ([climberId, ranking]): BoulderingUnlimitedContestRanking => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const climberResults = climbersResults.get(climberId)!;

          const nbTops = climberResults.tops.reduce(
            (tops, top) => (top ? tops + 1 : tops),
            0,
          );

          const climber = climbers.find((c) => c.id === climberId)!;

          return {
            nbTops,
            climber: {
              id: climberId,
              firstName: climber.firstName,
              lastName: climber.lastName,
              club: climber.club,
            },
            ranking,
            points: climberResults.points,
            tops: climberResults.tops,
          };
        },
      ),
    };
  }
}
