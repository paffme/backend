import { Test } from '@nestjs/testing';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import { InternalServerErrorException } from '@nestjs/common';
import * as uuid from 'uuid';
import { Competition } from '../../src/competition/competition.entity';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import TestUtils from '../utils';
import { User } from '../../src/user/user.entity';
import { BoulderingRoundCountedRankingService } from '../../src/bouldering/ranking/bouldering-round-counted-ranking.service';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Bouldering counted ranking service (unit)', () => {
  let utils: TestUtils;
  let boulderingRoundCountedRankingService: BoulderingRoundCountedRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingRoundCountedRankingService],
    }).compile();

    boulderingRoundCountedRankingService = module.get(
      BoulderingRoundCountedRankingService,
    );

    utils = new TestUtils();
  });

  function givenBoulder(index: number): Boulder {
    return new Boulder((undefined as unknown) as BoulderingRound, index);
  }

  function givenResult(
    climber: User,
    boulder: Boulder,
    data?: Partial<BoulderingResult>,
  ): BoulderingResult {
    const result = new BoulderingResult(
      climber,
      (undefined as unknown) as BoulderingRound,
      boulder,
    );

    result.top = data?.top ?? false;
    result.topInTries = data?.topInTries ?? 0;
    result.zone = data?.zone ?? false;
    result.zoneInTries = data?.zoneInTries ?? 0;
    result.tries = data?.tries ?? 0;

    return result;
  }

  function givenRound(
    boulders: Boulder[],
    results: BoulderingResult[],
    data?: Partial<
      Pick<
        BoulderingRound,
        | 'id'
        | 'name'
        | 'index'
        | 'quota'
        | 'rankingType'
        | 'type'
        | 'competition'
      >
    >,
  ): BoulderingRound {
    const round = new BoulderingRound(
      data?.name ?? uuid.v4(),
      data?.index ?? 0,
      data?.quota ?? 0,
      data?.rankingType ?? BoulderingRoundRankingType.CIRCUIT,
      data?.type ?? BoulderingRoundType.QUALIFIER,
      data?.competition ?? ({} as Competition),
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    round.results = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      init(): Promise<void> {
        return Promise.resolve();
      },
      getItems(): BoulderingResult[] {
        return results;
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    round.boulders = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      init(): Promise<void> {
        return Promise.resolve();
      },
      count(): number {
        return boulders.length;
      },
    };

    return round;
  }

  function givenUser(): User {
    const user = new User();
    user.id = utils.getRandomId();
    return user;
  }

  it('throws when getting rankings for an non counted round', () => {
    return expect(
      boulderingRoundCountedRankingService.getRankings(
        givenRound([], [], {
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('gets rankings for a circuit', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();

    const boulders = [givenBoulder(0), givenBoulder(1)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 10,
        zone: true,
        zoneInTries: 5,
      }),
      givenResult(firstClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 3,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[1], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    });

    const {
      rankings,
      type,
    } = await boulderingRoundCountedRankingService.getRankings(round);

    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);
    expect(firstClimberRanking!.tops).toEqual([true, false]);
    expect(firstClimberRanking!.topsInTries).toEqual([10, 0]);
    expect(firstClimberRanking!.zones).toEqual([true, true]);
    expect(firstClimberRanking!.zonesInTries).toEqual([5, 3]);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.tops).toEqual([true, true]);
    expect(secondClimberRanking!.topsInTries).toEqual([1, 3]);
    expect(secondClimberRanking!.zones).toEqual([true, true]);
    expect(secondClimberRanking!.zonesInTries).toEqual([1, 1]);
  });

  it('gets rankings for a limited contest', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();

    const boulders = [givenBoulder(0), givenBoulder(1)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 10,
        zone: true,
        zoneInTries: 5,
      }),
      givenResult(firstClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 3,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[1], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const {
      rankings,
      type,
    } = await boulderingRoundCountedRankingService.getRankings(round);

    expect(type).toEqual(BoulderingRoundRankingType.LIMITED_CONTEST);
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);
    expect(firstClimberRanking!.tops).toEqual([true, false]);
    expect(firstClimberRanking!.topsInTries).toEqual([10, 0]);
    expect(firstClimberRanking!.zones).toEqual([true, true]);
    expect(firstClimberRanking!.zonesInTries).toEqual([5, 3]);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.tops).toEqual([true, true]);
    expect(secondClimberRanking!.topsInTries).toEqual([1, 3]);
    expect(secondClimberRanking!.zones).toEqual([true, true]);
    expect(secondClimberRanking!.zonesInTries).toEqual([1, 1]);
  });

  it('sorts rankings by tops (1)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: false,
        zoneInTries: 0,
      }),
      givenResult(secondClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: false,
        zoneInTries: 0,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops (2)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: false,
        zoneInTries: 0,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: false,
        zoneInTries: 0,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones (1)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: false,
        zoneInTries: 0,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones (2)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: false,
        zoneInTries: 0,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones then by top in tries (1)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones then by top in tries (2)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones then by top in tries then by zone in tries (1)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 2,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones then by top in tries then by zone in tries (2)', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('handles ex-aequo', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('handles ex-aequo with no tops and no zones', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: false,
        zoneInTries: 0,
      }),
      givenResult(secondClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: false,
        zoneInTries: 0,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });
});
