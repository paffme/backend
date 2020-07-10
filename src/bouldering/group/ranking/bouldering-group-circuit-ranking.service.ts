import { BoulderingGroupRankingService } from './bouldering-group-ranking.service';
import { Injectable } from '@nestjs/common';
import { BoulderingResult } from '../../result/bouldering-result.entity';
import { User } from '../../../user/user.entity';
import { RankingsMap } from '../../types/rankings-map';

import {
  getExAequoClimbers,
  getPodium,
  handleExAequosRankings,
} from '../../ranking/ranking.utils';

import {
  BoulderingCircuitRanking,
  BoulderingCircuitRankings,
  BoulderingGroup,
} from '../bouldering-group.entity';

import { CompetitionRoundType } from '../../../competition/competition-round-type.enum';
import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { isNil } from '../../../shared/utils/objects.helper';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

type AggregatedBoulderingCircuitResults = Pick<
  BoulderingCircuitRanking,
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

@Injectable()
export class BoulderingGroupCircuitRankingService
  implements BoulderingGroupRankingService {
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
    const entries = Array.from(results).sort((a, b): number => {
      // FIRST BY TOPS
      const topsDelta = this.compareByTops(a, b);

      if (topsDelta !== 0) {
        return topsDelta;
      }

      // THEN BY ZONES
      const zonesDelta = this.compareByZones(a, b);

      if (zonesDelta !== 0) {
        return zonesDelta;
      }

      // THEN BY TOPS IN TRIES
      const topsInTriesDelta = this.compareByTopsInTries(a, b);

      if (topsInTriesDelta !== 0) {
        return topsInTriesDelta;
      }

      // THEN BY ZONES IN TRIES
      return this.compareByZonesInTries(a, b);
    });

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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

        if (isNil(climberATryOccurrence)) {
          continue;
        }

        for (let j = 0; j < climbers.length; j++) {
          const climberB = climbers[j];

          if (climberA === climberB) {
            continue;
          }

          const climberBTryOccurrence = tryOccurrence.get(climberB)!.get(tryId);

          if (
            isNil(climberBTryOccurrence) ||
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

  private handleNonRankedClimbers(
    rankings: RankingsMap,
    climbers: User[],
  ): void {
    const lastRanking =
      Math.max(...Array.from(rankings, ([, ranking]) => ranking)) + 1;

    for (const climber of climbers) {
      if (rankings.has(climber.id)) {
        continue;
      }

      rankings.set(climber.id, lastRanking);
    }
  }

  getRankings(group: BoulderingGroup): BoulderingCircuitRankings {
    // Compute group ranking
    const bouldersCount = group.boulders.count();
    const results = group.results.getItems();
    const climbers = group.climbers.getItems();

    // Group results by climber and aggregate results
    const climberResults = this.groupResultsByClimber(results, bouldersCount);

    // Compute rankings
    const groupRankings = this.computeRankings(climberResults);

    // Handle equality in the podium for the final
    if (group.round.type === CompetitionRoundType.FINAL) {
      this.handlePodiumExAequos(groupRankings, climberResults);
    }

    // Handle climbers with no results in semi-final or final
    if (
      group.round.type === CompetitionRoundType.SEMI_FINAL ||
      group.round.type === CompetitionRoundType.FINAL
    ) {
      this.handleNonRankedClimbers(groupRankings, climbers);
    }

    // Gather all information
    return {
      type: BoulderingRoundRankingType.CIRCUIT,
      boulders: group.boulders.getItems().map((b) => b.id),
      rankings: Array.from(
        groupRankings,
        ([climberId, ranking]): BoulderingCircuitRanking => {
          const climber = climbers.find((c) => c.id === climberId)!;
          const climberResult = climberResults.get(climber.id);

          return {
            tops: climberResult?.tops || [],
            topsInTries: climberResult?.topsInTries || [],
            zones: climberResult?.zones || [],
            zonesInTries: climberResult?.zonesInTries || [],
            climber: {
              id: climberId,
              firstName: climber.firstName,
              lastName: climber.lastName,
              club: climber.club,
            },
            ranking,
          };
        },
      ),
    };
  }
}
