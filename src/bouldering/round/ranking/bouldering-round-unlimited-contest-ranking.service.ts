import { Injectable, InternalServerErrorException } from '@nestjs/common';

import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundUnlimitedContestRanking,
  BoulderingRoundUnlimitedContestRankings,
} from '../bouldering-round.entity';

import { User } from '../../../user/user.entity';
import { BoulderingResult } from '../../result/bouldering-result.entity';
import { BoulderingRoundRankingService } from './bouldering-round-ranking.service';
import { RankingsMap } from '../../types/rankings-map';
import { BoulderingGroup } from '../../group/bouldering-group.entity';
import { handleExAequosRankings } from '../../ranking/ranking.utils';

type AggregatedBoulderingUnlimitedResults = Pick<
  BoulderingRoundUnlimitedContestRanking,
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
export class BoulderingRoundUnlimitedContestRankingService
  implements BoulderingRoundRankingService {
  readonly rankingType = BoulderingRoundRankingType.UNLIMITED_CONTEST;

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

  getRankings(round: BoulderingRound): BoulderingRoundUnlimitedContestRankings {
    if (round.rankingType !== this.rankingType) {
      throw new InternalServerErrorException('Wrong ranking type');
    }

    // Compute each group ranking
    const groupsRankings = new Map<
      typeof BoulderingGroup.prototype.id,
      RankingsMap
    >();

    const groupsResults = new Map<
      typeof BoulderingGroup.prototype.id,
      AggregatedClimbersResultsMap
    >();

    const groupsBouldersPoint = new Map<
      typeof BoulderingGroup.prototype.id,
      number[]
    >();

    for (const group of round.groups.getItems()) {
      const boulders = group.boulders.count();
      const results = group.results.getItems();

      // First compute each boulder points
      const bouldersPoints = this.getBouldersPoints(results, boulders);

      // Group results by climber and aggregate results
      const climberResults = this.groupResultsByClimber(
        results,
        bouldersPoints,
        boulders,
      );

      // Compute rankings
      const groupRankings = this.computeRankings(climberResults);

      // Save rankings
      groupsBouldersPoint.set(group.id, bouldersPoints);
      groupsResults.set(group.id, climberResults);
      groupsRankings.set(group.id, groupRankings);
    }

    // Gather all information
    return {
      type: this.rankingType,
      groups: Array.from(groupsRankings, ([groupId, groupRankings]) => {
        const rankings = Array.from(
          groupRankings,
          ([climberId, ranking]): BoulderingRoundUnlimitedContestRanking => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const climberResults = groupsResults.get(groupId)!.get(climberId)!;

            const nbTops = climberResults.tops.reduce(
              (tops, top) => (top ? tops + 1 : tops),
              0,
            );

            return {
              nbTops,
              climberId,
              ranking,
              points: climberResults.points,
              tops: climberResults.tops,
            };
          },
        );

        return {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          bouldersPoints: groupsBouldersPoint.get(groupId)!,
          rankings,
          id: groupId,
        };
      }),
    };
  }
}
