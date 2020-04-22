import { Test } from '@nestjs/testing';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import { InternalServerErrorException } from '@nestjs/common';
import * as uuid from 'uuid';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import TestUtils from '../utils';
import { User } from '../../src/user/user.entity';
import { BoulderingRoundCountedRankingService } from '../../src/bouldering/round/ranking/bouldering-round-counted-ranking.service';
import { givenBoulderingRound } from '../fixture/bouldering-round.fixture';

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
    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      ...data,
    });

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

  function givenUser(id?: typeof User.prototype.id): User {
    const user = new User(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4());
    user.id = id ?? utils.getRandomId();
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

  it('shifts rankings after ex-aequos', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const thirdClimber = givenUser();
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
      givenResult(thirdClimber, boulders[0], {
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

    expect(rankings).toHaveLength(3);

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

    const thirdClimberRanking = rankings.find(
      (c) => c.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);
  });

  it('handles equality for the podium climbers in a final by using the number of tops in the first try, second try, etc... (1)', async () => {
    const firstClimber = givenUser(0);
    const secondClimber = givenUser(1);
    const thirdClimber = givenUser(2);
    const fourthClimber = givenUser(3);
    const fifthClimber = givenUser(4);

    const boulders = [
      givenBoulder(0),
      givenBoulder(1),
      givenBoulder(2),
      givenBoulder(3),
    ];

    const results = [
      // FIRST CLIMBER
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[1], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[2], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[3], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
      // SECOND CLIMBER
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[1], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[2], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[3], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      // THIRD CLIMBER
      givenResult(thirdClimber, boulders[0], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[3], {
        top: true,
        topInTries: 5,
        zone: true,
        zoneInTries: 1,
      }),
      // Fourth climber
      givenResult(fourthClimber, boulders[0], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[3], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      // Fifth climber
      givenResult(fifthClimber, boulders[0], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[3], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(5);

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

    const thirdClimberRanking = rankings.find(
      (c) => c.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climberId === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(4);

    const fifthClimberRanking = rankings.find(
      (c) => c.climberId === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(4);
  });

  it('handles equality for the podium climbers in a final by using the number of tops in the first try, second try, etc... (2)', async () => {
    const firstClimber = givenUser(0);
    const secondClimber = givenUser(1);
    const thirdClimber = givenUser(2);
    const fourthClimber = givenUser(3);
    const fifthClimber = givenUser(4);

    const boulders = [
      givenBoulder(0),
      givenBoulder(1),
      givenBoulder(2),
      givenBoulder(3),
    ];

    const results = [
      // FIRST CLIMBER
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[3], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      // SECOND CLIMBER
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[3], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      // THIRD CLIMBER
      givenResult(thirdClimber, boulders[0], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[1], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[2], {
        top: true,
        topInTries: 4,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[3], {
        top: true,
        topInTries: 5,
        zone: true,
        zoneInTries: 1,
      }),
      // Fourth climber
      givenResult(fourthClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[1], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[2], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[3], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      // Fifth climber
      givenResult(fifthClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[1], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[2], {
        top: true,
        topInTries: 2,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[3], {
        top: true,
        topInTries: 3,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(4);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(4);

    const thirdClimberRanking = rankings.find(
      (c) => c.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climberId === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(2);

    const fifthClimberRanking = rankings.find(
      (c) => c.climberId === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(1);
  });

  it('handles equality for the podium climbers in a final by using the number of zones in the first try, second try, etc... (1)', async () => {
    const firstClimber = givenUser(0);
    const secondClimber = givenUser(1);
    const thirdClimber = givenUser(2);
    const fourthClimber = givenUser(3);
    const fifthClimber = givenUser(4);

    const boulders = [
      givenBoulder(0),
      givenBoulder(1),
      givenBoulder(2),
      givenBoulder(3),
    ];

    const results = [
      // FIRST CLIMBER
      givenResult(firstClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(firstClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 3,
      }),
      // SECOND CLIMBER
      givenResult(secondClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(secondClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(secondClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      // THIRD CLIMBER
      givenResult(thirdClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(thirdClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(thirdClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      // Fourth climber
      givenResult(fourthClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fourthClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fourthClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fourthClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      // Fifth climber
      givenResult(fifthClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fifthClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fifthClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      givenResult(fifthClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(5);

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

    const thirdClimberRanking = rankings.find(
      (c) => c.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climberId === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(4);

    const fifthClimberRanking = rankings.find(
      (c) => c.climberId === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(4);
  });

  it('handles equality for the podium climbers in a final by using the number of zones in the first try, second try, etc... (2)', async () => {
    const firstClimber = givenUser(0);
    const secondClimber = givenUser(1);
    const thirdClimber = givenUser(2);
    const fourthClimber = givenUser(3);
    const fifthClimber = givenUser(4);

    const boulders = [
      givenBoulder(0),
      givenBoulder(1),
      givenBoulder(2),
      givenBoulder(3),
    ];

    const results = [
      // FIRST CLIMBER
      givenResult(firstClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(firstClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(firstClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      givenResult(firstClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      // SECOND CLIMBER
      givenResult(secondClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(secondClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(secondClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(secondClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      // THIRD CLIMBER
      givenResult(thirdClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(thirdClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(thirdClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(thirdClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 4,
      }),
      // Fourth climber
      givenResult(fourthClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fourthClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      givenResult(fourthClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 2,
      }),
      // Fifth climber
      givenResult(fifthClimber, boulders[0], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[1], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[2], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 1,
      }),
      givenResult(fifthClimber, boulders[3], {
        top: false,
        topInTries: 0,
        zone: true,
        zoneInTries: 3,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
    });

    const { rankings } = await boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(4);

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(4);

    const thirdClimberRanking = rankings.find(
      (c) => c.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climberId === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(2);

    const fifthClimberRanking = rankings.find(
      (c) => c.climberId === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(1);
  });

  it('handles equality for the podium climbers and let them ex-aequo if they cannot be separated', async () => {
    const firstClimber = givenUser(0);
    const secondClimber = givenUser(1);

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
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
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

  it('does nothing if there are no ex aequos in a final round', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();

    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
        topInTries: 10,
        zone: true,
        zoneInTries: 5,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
        topInTries: 1,
        zone: true,
        zoneInTries: 1,
      }),
    ];

    const round = givenRound(boulders, results, {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      type: BoulderingRoundType.FINAL,
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

    const secondClimberRanking = rankings.find(
      (c) => c.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });
});
