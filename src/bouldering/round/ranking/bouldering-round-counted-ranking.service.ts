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
import {
  getExAequoClimbers,
  getPodium,
  handleExAequosRankings,
} from '../../ranking/ranking.utils';
import { RankingsMap } from '../../types/rankings-map';
import { BoulderingGroup } from '../../group/bouldering-group.entity';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

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

  private computeRankings(results: AggregatedClimbersResultsMap): RankingsMap {
    const entries = Array.from(results)
      .sort(this.compareByTops.bind(this))
      .sort(this.compareByZones.bind(this))
      .sort(this.compareByTopsInTries.bind(this))
      .sort(this.compareByZonesInTries.bind(this));

    return handleExAequosRankings(entries, this.areExAequo);
  }

  private getTopsInTriesByClimber(
    climbersIds: typeof User.prototype.id[],
    results: AggregatedClimbersResultsMap,
  ): Map<typeof User.prototype.id, number[]> {
    return climbersIds.reduce<Map<typeof User.prototype.id, number[]>>(
      (map, climberId) => {
        map.set(climberId, results.get(climberId)!.topsInTries);
        return map;
      },
      new Map(),
    );
  }

  private getZonesInTriesByClimber(
    climbersIds: typeof User.prototype.id[],
    results: AggregatedClimbersResultsMap,
  ): Map<typeof User.prototype.id, number[]> {
    return climbersIds.reduce<Map<typeof User.prototype.id, number[]>>(
      (map, climberId) => {
        map.set(climberId, results.get(climberId)!.zonesInTries);
        return map;
      },
      new Map(),
    );
  }

  private getTryOccurrenceByClimber(
    triesByClimber: Map<typeof User.prototype.id, number[]>,
  ): {
    map: Map<typeof User.prototype.id, Map<number, number>>;
    minTry: number;
    maxTry: number;
  } {
    const map = new Map();
    let maxTry = 1;
    let minTry = Number.MAX_SAFE_INTEGER;

    for (const [climberId, tries] of triesByClimber) {
      const maxNumTry = Math.max(...tries);
      const triesByTryMap = new Map();

      for (let i = 1; i <= maxNumTry; i++) {
        const triesOccurrence = tries.reduce(
          (counter, tries) => (tries === i ? counter + 1 : counter),
          0,
        );

        if (triesOccurrence > 0) {
          if (i > maxTry) {
            maxTry = i;
          }

          if (i < minTry) {
            minTry = i;
          }

          triesByTryMap.set(i, triesOccurrence);
        }
      }

      map.set(climberId, triesByTryMap);
    }

    return {
      map,
      minTry,
      maxTry,
    };
  }

  private sortByTryOccurrence(
    rankings: RankingsMap,
    climbers: typeof User.prototype.id[],
    tryOccurrence: Map<typeof User.prototype.id, Map<number, number>>,
    minTry: number,
    maxTry: number,
  ): void {
    let sorted = false;

    for (let tryId = minTry; tryId <= maxTry; tryId++) {
      for (let i = 0; i < climbers.length; i++) {
        const climberA = climbers[i];
        const climberATryOccurrence = tryOccurrence.get(climberA)!.get(tryId);

        if (typeof climberATryOccurrence === 'undefined') {
          continue;
        }

        for (let j = 0; j < climbers.length; j++) {
          const climberB = climbers[j];

          if (climberA === climberB) {
            continue;
          }

          const climberBTryOccurrence = tryOccurrence.get(climberB)!.get(tryId);

          if (
            typeof climberBTryOccurrence === 'undefined' ||
            climberATryOccurrence > climberBTryOccurrence
          ) {
            rankings.set(climberB, rankings.get(climberB)! + 1);
            sorted = true;
          } else if (climberATryOccurrence < climberBTryOccurrence) {
            rankings.set(climberA, rankings.get(climberA)! + 1);
            sorted = true;
          }
        }

        if (sorted) {
          return;
        }
      }
    }
  }

  /**
   * Sort podium ex aequos by using the number of top done for the first try, then the second try, etc...
   * @param rankings
   * @param results
   */
  private handlePodiumExAequos(
    rankings: RankingsMap,
    results: AggregatedClimbersResultsMap,
  ): void {
    const podium = getPodium(rankings);
    const exAequos = getExAequoClimbers(podium);

    if (exAequos.length === 0) {
      return;
    }

    for (const climbers of exAequos) {
      const topsInTries = this.getTopsInTriesByClimber(climbers, results);
      const zonesInTries = this.getZonesInTriesByClimber(climbers, results);

      for (const tries of [topsInTries, zonesInTries]) {
        const { map, minTry, maxTry } = this.getTryOccurrenceByClimber(tries);
        this.sortByTryOccurrence(rankings, climbers, map, minTry, maxTry);
      }
    }
  }

  getRankings(
    round: BoulderingRound,
  ): BoulderingRoundCircuitRankings | BoulderingRoundLimitedContestRankings {
    if (
      round.rankingType !== BoulderingRoundRankingType.CIRCUIT &&
      round.rankingType !== BoulderingRoundRankingType.LIMITED_CONTEST
    ) {
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

    for (const group of round.groups.getItems()) {
      const boulders = group.boulders.count();
      const results = group.results.getItems();

      // Group results by climber and aggregate results
      const climberResults = this.groupResultsByClimber(results, boulders);

      // Compute rankings
      const groupRankings = this.computeRankings(climberResults);

      // Handle equality in the podium for the final
      if (round.type === BoulderingRoundType.FINAL) {
        this.handlePodiumExAequos(groupRankings, climberResults);
      }

      // Save
      groupsResults.set(group.id, climberResults);
      groupsRankings.set(group.id, groupRankings);
    }

    // Gather all information
    return {
      type: round.rankingType,
      groups: Array.from(groupsRankings, ([groupId, groupRankings]) => {
        if (round.type !== BoulderingRoundType.QUALIFIER) {
          const currentGroup = round.groups
            .getItems()
            .find((g) => g.id === groupId)!;

          const lastRanking = Array.from(groupRankings).reduce(
            (lastRanking, [, ranking]) =>
              ranking >= lastRanking ? ranking + 1 : lastRanking,
            1,
          );

          for (const climber of currentGroup.climbers.getItems()) {
            if (groupRankings.get(climber.id)) {
              continue;
            }

            groupRankings.set(climber.id, lastRanking);
          }
        }

        const rankings = Array.from(
          groupRankings,
          ([climberId, ranking]): BoulderingRoundCountedRanking => ({
            ...groupsResults.get(groupId)!.get(climberId)!,
            climberId,
            ranking,
          }),
        );

        return {
          id: groupId,
          rankings,
        };
      }),
    };
  }
}
