import { Test } from '@nestjs/testing';
import { BoulderingRankingService } from '../../src/bouldering/ranking/bouldering-ranking.service';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';

describe('Bouldering round service (unit)', () => {
  let boulderingRankingService: BoulderingRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingRankingService],
    }).compile();

    boulderingRankingService = module.get(BoulderingRankingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a ranking with multiple rounds without ex-aequos', () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 4,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 2,
            },
            {
              tops: [true, true, false, false],
              nbTops: 2,
              points: 100,
              ranking: 3,
              climberId: 3,
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climberId: 4,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.SEMI_FINAL,
        index: 1,
        quota: 2,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [false, false, false, false],
              topsInTries: [0, 0, 0, 4],
              zones: [false, false, false, true],
              zonesInTries: [0, 0, 0, 1],
              ranking: 3,
              climberId: 1,
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 2, 3, 0],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 2,
              climberId: 2,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.FINAL,
        index: 2,
        quota: 0,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 2, 3, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(3);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with ex-aequos', () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 4,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, false, false],
              nbTops: 2,
              points: 100,
              ranking: 3,
              climberId: 3,
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climberId: 4,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.SEMI_FINAL,
        index: 1,
        quota: 2,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [false, false, false, false],
              topsInTries: [0, 0, 0, 4],
              zones: [false, false, false, true],
              zonesInTries: [0, 0, 0, 1],
              ranking: 3,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.FINAL,
        index: 2,
        quota: 0,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(3);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with ex-aequos at the end', () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 4,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 2,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 3,
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climberId: 4,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.FINAL,
        index: 1,
        quota: 0,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climberId: 2,
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(2);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with multiple different ex-aequos', () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 5,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 3,
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climberId: 4,
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climberId: 5,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.FINAL,
        index: 1,
        quota: 0,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 2,
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 3,
              climberId: 3,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(5);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(3);
    expect(rankings.get(4)).toEqual(4);
    expect(rankings.get(4)).toEqual(4);
  });

  it('handles ex-aequos after a semi-final by using qualifier results', async () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 2,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 2,
            },
          ],
        },
      } as unknown) as BoulderingRound,
      ({
        type: BoulderingRoundType.SEMI_FINAL,
        index: 1,
        quota: 0,
        rankings: {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climberId: 2,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(2);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(1);
  });

  it('handles more than 2 ex-aequos', async () => {
    const rounds: BoulderingRound[] = [
      ({
        type: BoulderingRoundType.QUALIFIER,
        index: 0,
        quota: 3,
        climbers: {
          count: () => 3,
        },
        rankings: {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          bouldersPoints: [50, 50, 50, 50],
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climberId: 1,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 2,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 3,
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climberId: 4,
            },
            {
              tops: [false, false, false, false],
              nbTops: 0,
              points: 0,
              ranking: 5,
              climberId: 5,
            },
          ],
        },
      } as unknown) as BoulderingRound,
    ];

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(5);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(2);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(2);
    expect(rankings.get(5)).toEqual(5);
  });
});
