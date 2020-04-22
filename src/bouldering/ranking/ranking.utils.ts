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

export function getPodium(rankings: RankingsMap): RankingsMap {
  return new Map(
    Array.from(rankings).filter(([, ranking]) => ranking >= 1 && ranking <= 3),
  );
}
