import { User } from '../../user/user.entity';
import { RankingsMap } from '../types/rankings-map';

export function getExAequoClimbers(
  rankings: RankingsMap,
): typeof User.prototype.id[][] {
  const exAequoClimbers: typeof User.prototype.id[][] = [];
  const entries = Array.from(rankings);

  for (let i = 0; i < rankings.size; i++) {
    const [climberIdA, climberRankingA] = entries[i];

    if (exAequoClimbers.flat().includes(climberIdA)) {
      continue;
    }

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

type AggregatedClimbersResultsEntry<Results> = [
  typeof User.prototype.id,
  Results,
];

type exAequoFn<Results> = (
  resultA: AggregatedClimbersResultsEntry<Results>,
  resultB: AggregatedClimbersResultsEntry<Results>,
) => boolean;

/**
 * Separate correctly ex aequos
 */
export function handleExAequosRankings<Results>(
  sortedEntries: AggregatedClimbersResultsEntry<Results>[],
  exAequoFn: exAequoFn<Results>,
): RankingsMap {
  const rankings = new Map();
  let previousClimberEntry: AggregatedClimbersResultsEntry<Results> | undefined;
  let previousClimberRanking: number | undefined;

  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];
    const climberId = entry[0];
    let ranking: number;

    if (
      typeof previousClimberRanking === 'number' &&
      previousClimberEntry &&
      exAequoFn(entry, previousClimberEntry)
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

export function getPodium(rankings: RankingsMap): RankingsMap {
  return new Map(
    Array.from(rankings).filter(([, ranking]) => ranking >= 1 && ranking <= 3),
  );
}
