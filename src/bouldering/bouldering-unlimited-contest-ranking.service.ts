import { Injectable, InternalServerErrorException } from '@nestjs/common';

import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingUnlimitedContestRanking,
} from './bouldering-round.entity';

import { User } from '../user/user.entity';
import { BoulderingResult } from './bouldering-result.entity';

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

type RankingsMap = Map<typeof User.prototype.id, number>;

@Injectable()
export class BoulderingUnlimitedContestRankingService {
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
    boulders: number,
  ): AggregatedClimbersResultsMap {
    const bouldersPoints = this.getBouldersPoints(results, boulders);

    return results.reduce<AggregatedClimbersResultsMap>((map, result) => {
      const boulderIndex = result.boulder.index;
      const aggregatedResults = map.get(result.climber.id) ?? {
        tops: new Array(boulders).fill(false),
        points: 0,
      };

      aggregatedResults.tops[boulderIndex] = result.top;
      aggregatedResults.points += bouldersPoints[boulderIndex];
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

  private computeRankings(
    entries: AggregatedClimbersResultsEntry[],
  ): RankingsMap {
    const rankings: RankingsMap = new Map();

    let previousClimberEntry:
      | [typeof User.prototype.id, AggregatedBoulderingUnlimitedResults]
      | undefined;

    let previousClimberRanking: number | undefined;

    // Firstly sort entries by points
    entries = this.sortClimbersByPoints(entries);

    // Then handle ex-aequo and define final ranking
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const [climberId, { points }] = entry;
      let ranking: number;

      if (
        typeof previousClimberRanking === 'number' &&
        previousClimberEntry &&
        Math.abs(points - previousClimberEntry[1].points) < 1e3
      ) {
        ranking = previousClimberRanking;
      } else {
        ranking = i + 1;
      }

      rankings.set(climberId, ranking);
      previousClimberEntry = entry;
      previousClimberRanking = ranking;
    }

    return rankings;
  }

  getRankings(round: BoulderingRound): BoulderingUnlimitedContestRanking[] {
    if (round.rankingType !== BoulderingRoundRankingType.UNLIMITED_CONTEST) {
      throw new InternalServerErrorException('Wrong ranking type');
    }

    const results = round.results.getItems();
    const boulders = round.boulders.count();

    // Group results by climber and aggregate results
    const climberResults = this.groupResultsByClimber(results, boulders);

    // Sort by points
    const entries = Array.from(climberResults);

    // Then handle rankings
    const rankings = this.computeRankings(entries);

    // Gather all information
    return entries.map(
      ([climberId, aggregatedResults]): BoulderingUnlimitedContestRanking => {
        return {
          nbTops: aggregatedResults.tops.reduce(
            (tops, top) => (top ? tops + 1 : tops),
            0,
          ),
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ranking: rankings.get(climberId)!,
          ...aggregatedResults,
          climberId,
        };
      },
    );
  }
}
