import { BoulderingRoundRankingService } from './bouldering-round-ranking.service';

import {
  BoulderingRoundCircuitRankings,
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundCountedRanking,
} from '../round/bouldering-round.entity';

import { InternalServerErrorException } from '@nestjs/common';
import { BoulderingResult } from '../result/bouldering-result.entity';
import { User } from '../../user/user.entity';

type AggregatedBoulderingCircuitResults = Pick<
  BoulderingRoundCountedRanking,
  'tops' | 'topsInTries' | 'zones' | 'zonesInTries'
>;

type AggregatedClimbersResultsEntry = [
  typeof User.prototype.id,
  AggregatedBoulderingCircuitResults,
];

type AggregatedClimbersResultsMap = Map<
  AggregatedClimbersResultsEntry[0],
  AggregatedClimbersResultsEntry[1]
>;

type RankingsMap = Map<typeof User.prototype.id, number>;

export class BoulderingRoundCircuitRankingService
  implements BoulderingRoundRankingService {
  readonly rankingType = BoulderingRoundRankingType.CIRCUIT;

  private groupResultsByClimber(
    results: BoulderingResult[],
    boulders: number,
  ): AggregatedClimbersResultsMap {
    return results.reduce<AggregatedClimbersResultsMap>((map, result) => {
      const boulderIndex = result.boulder.index;
      const aggregatedResults = map.get(result.climber.id) ?? {
        tops: new Array(boulders).fill(false),
        topsInTries: new Array(boulders).fill(0),
        zones: new Array(boulders).fill(false),
        zonesInTries: new Array(boulders).fill(0),
      };

      aggregatedResults.tops[boulderIndex] = result.top;
      aggregatedResults.topsInTries[boulderIndex] = result.topInTries;
      aggregatedResults.zones[boulderIndex] = result.zone;
      aggregatedResults.zonesInTries[boulderIndex] = result.zoneInTries;

      map.set(result.climber.id, aggregatedResults);
      return map;
    }, new Map());
  }

  private compareByTops(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    if (a[1].tops > b[1].tops) {
      return -1;
    }

    if (a[1].tops < b[1].tops) {
      return 1;
    }

    return 0;
  }

  private compareByTopsInTries(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    if (a[1].topsInTries > b[1].topsInTries) {
      return 1;
    }

    if (a[1].topsInTries < b[1].topsInTries) {
      return -1;
    }

    return 0;
  }

  private compareByZones(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    if (a[1].zones > b[1].zones) {
      return -1;
    }

    if (a[1].zones < b[1].zones) {
      return 1;
    }

    return 0;
  }

  private compareByZonesInTries(
    a: AggregatedClimbersResultsEntry,
    b: AggregatedClimbersResultsEntry,
  ): number {
    if (a[1].zonesInTries > b[1].zonesInTries) {
      return 1;
    }

    if (a[1].zonesInTries < b[1].zonesInTries) {
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

    if (resultA.tops !== resultB.tops) {
      return false;
    }

    if (resultA.zones !== resultB.zones) {
      return false;
    }

    if (resultA.zonesInTries !== resultB.zonesInTries) {
      return false;
    }

    if (resultA.topsInTries !== resultB.topsInTries) {
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
      .sort(this.compareByTops)
      .sort(this.compareByZones)
      .sort(this.compareByTopsInTries)
      .sort(this.compareByZonesInTries);

    // Then handle ex-aequo and define final ranking
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const [climberId] = entry;
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

  async getRankings(
    round: BoulderingRound,
  ): Promise<BoulderingRoundCircuitRankings> {
    if (round.rankingType !== this.rankingType) {
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

    // Gather all information
    return {
      type: this.rankingType,
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
