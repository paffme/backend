import { BoulderingRoundRankingService } from './bouldering-round-ranking.service';

import {
  BoulderingRound,
  BoulderingRoundCircuitRankings,
  BoulderingRoundCountedRanking,
  BoulderingRoundLimitedContestRankings,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../bouldering-round.entity';

import { InternalServerErrorException } from '@nestjs/common';
import { BoulderingResult } from '../../result/bouldering-result.entity';
import { User } from '../../../user/user.entity';
import { getExAequoClimbers } from '../../ranking/ranking.utils';
import { RankingsMap } from '../../types/rankings-map';

type AggregatedBoulderingCircuitResults = Pick<
  BoulderingRoundCountedRanking,
  'tops' | 'topsInTries' | 'zones' | 'zonesInTries'
> & {
  sumTops: number;
  sumTopsInTries: number;
  sumZones: number;
  sumZonesInTries: number;
};

type AggregatedClimbersResultsEntry = [
  typeof User.prototype.id,
  AggregatedBoulderingCircuitResults,
];

type AggregatedClimbersResultsMap = Map<
  AggregatedClimbersResultsEntry[0],
  AggregatedClimbersResultsEntry[1]
>;

export class BoulderingRoundCountedRankingService
  implements BoulderingRoundRankingService {
  private groupResultsByClimber(
    results: BoulderingResult[],
    boulders: number,
  ): AggregatedClimbersResultsMap {
    return results.reduce<AggregatedClimbersResultsMap>((map, result) => {
      const boulderIndex = result.boulder.index;
      const aggregatedResults = map.get(result.climber.id) ?? {
        tops: new Array(boulders).fill(false),
        topsInTries: new Array(boulders).fill(0),
        sumTops: 0,
        sumTopsInTries: 0,
        zones: new Array(boulders).fill(false),
        zonesInTries: new Array(boulders).fill(0),
        sumZones: 0,
        sumZonesInTries: 0,
      };

      aggregatedResults.tops[boulderIndex] = result.top;

      if (result.top) {
        aggregatedResults.sumTops++;
      }

      aggregatedResults.topsInTries[boulderIndex] = result.topInTries;
      aggregatedResults.sumTopsInTries += result.topInTries;

      aggregatedResults.zones[boulderIndex] = result.zone;

      if (result.zone) {
        aggregatedResults.sumZones++;
      }

      aggregatedResults.zonesInTries[boulderIndex] = result.zoneInTries;
      aggregatedResults.sumZonesInTries += result.zoneInTries;

      map.set(result.climber.id, aggregatedResults);
      return map;
    }, new Map());
  }

  private compareByTops(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    const aSumTops = a[1].sumTops;
    const bSumTops = b[1].sumTops;

    if (aSumTops > bSumTops) {
      return -1;
    }

    if (aSumTops < bSumTops) {
      return 1;
    }

    return 0;
  }

  private compareByTopsInTries(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    const aSumTopsInTries = a[1].sumTopsInTries;
    const bSumTopsInTries = b[1].sumTopsInTries;

    if (aSumTopsInTries === 0 && bSumTopsInTries === 0) {
      return 0;
    }

    if (aSumTopsInTries === 0) {
      return 1;
    }

    if (aSumTopsInTries > bSumTopsInTries) {
      return 1;
    }

    if (aSumTopsInTries < bSumTopsInTries) {
      return -1;
    }

    return 0;
  }

  private compareByZones(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    const aSumZones = a[1].sumZones;
    const bSumZones = b[1].sumZones;

    if (aSumZones > bSumZones) {
      return -1;
    }

    if (aSumZones < bSumZones) {
      return 1;
    }

    return 0;
  }

  private compareByZonesInTries(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    const aSumZonesInTries = a[1].sumZonesInTries;
    const bSumZonesInTries = b[1].sumZonesInTries;

    if (aSumZonesInTries === 0 && bSumZonesInTries === 0) {
      return 0;
    }

    if (aSumZonesInTries === 0) {
      return 1;
    }

    if (aSumZonesInTries > bSumZonesInTries) {
      return 1;
    }

    if (aSumZonesInTries < bSumZonesInTries) {
      return -1;
    }

    return 0;
  }

  private areExAequo(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): boolean {
    const resultA = a[1];
    const resultB = b[1];

    if (resultA.sumTops !== resultB.sumTops) {
      return false;
    }

    if (resultA.sumZones !== resultB.sumZones) {
      return false;
    }

    if (resultA.sumZonesInTries !== resultB.sumZonesInTries) {
      return false;
    }

    if (resultA.sumTopsInTries !== resultB.sumTopsInTries) {
      return false;
    }

    return true;
  }

  private computeRankings(
    entries: AggregatedClimbersResultsEntry[],
  ): RankingsMap {
    const rankings: RankingsMap = new Map();

    let previousClimberEntry: AggregatedClimbersResultsEntry | undefined;
    let previousClimberRanking: number | undefined;

    // Firstly sort entries by points
    entries = entries
      .sort(this.compareByTops.bind(this))
      .sort(this.compareByZones.bind(this))
      .sort(this.compareByTopsInTries.bind(this))
      .sort(this.compareByZonesInTries.bind(this));

    // Then handle ex-aequo and define final ranking
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const climberId = entry[0];
      let ranking: number;

      if (
        typeof previousClimberRanking === 'number' &&
        previousClimberEntry &&
        this.areExAequo(entry, previousClimberEntry)
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

  private getTopsInTriesByTry(
    climbersIds: typeof User.prototype.id[],
    results: AggregatedClimbersResultsMap,
  ): Map<typeof User.prototype.id, Map<number, number>> {
    const map = new Map();

    const climbersTopsInTries = climbersIds.map((climberId) => ({
      climberId,
      topsInTries: results.get(climberId)!.topsInTries,
    }));

    for (const { climberId, topsInTries } of climbersTopsInTries) {
      const maxNumTry = topsInTries.reduce((maxNumTry, topInTries) => {
        const maxTopInTries = Math.max(topInTries);

        if (maxTopInTries > maxNumTry) {
          return maxTopInTries;
        }

        return maxNumTry;
      }, 1);

      const climberTriesByTryMap = new Map();

      for (let i = 1; i < maxNumTry; i++) {
        // à l'aide je me perd
      }

      map.set(climberId, climberTriesByTryMap);
    }

    return map;
  }

  private handlePodiumExAequos(
    rankings: RankingsMap,
    results: AggregatedClimbersResultsMap,
  ): void {
    const podiumExAequos = getExAequoClimbers(rankings).filter((climbers) => {
      const ranking = rankings.get(climbers[0])!;
      return ranking >= 1 && ranking <= 3;
    });

    if (podiumExAequos.length === 0) {
      return;
    }

    // Sort by numbers of top for the first try, then the second try, etc...
    for (const exAequos of podiumExAequos) {
      const numTry = 1;

      while (true) {
        const climbersTopsForSpecificTry = exAequos.map((climberId) =>
          results
            .get(climberId)!
            .topsInTries.reduce(
              (counter, tries) => (tries === numTry ? counter + 1 : counter),
              0,
            ),
        );
      }
    }
  }

  async getRankings(
    round: BoulderingRound,
  ): Promise<
    BoulderingRoundCircuitRankings | BoulderingRoundLimitedContestRankings
  > {
    if (
      round.rankingType !== BoulderingRoundRankingType.CIRCUIT &&
      round.rankingType !== BoulderingRoundRankingType.LIMITED_CONTEST
    ) {
      throw new InternalServerErrorException('Wrong ranking type');
    }

    await Promise.all([round.results.init(), round.boulders.init()]);
    const results = round.results.getItems();
    const boulders = round.boulders.count();

    // Group results by climber and aggregate results
    const climberResults = this.groupResultsByClimber(results, boulders);

    // Then handle rankings
    const entries = Array.from(climberResults);
    const rankings = this.computeRankings(entries);

    // Handle equality in the podium for the final
    if (round.type === BoulderingRoundType.FINAL) {
      this.handlePodiumExAequos(rankings, climberResults);
    }

    // Gather all information
    return {
      type: round.rankingType,
      rankings: entries.map(
        ([climberId, aggregatedResults]): BoulderingRoundCountedRanking => ({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ranking: rankings.get(climberId)!,
          ...aggregatedResults,
          climberId,
        }),
      ),
    };
  }
}
