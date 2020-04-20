import { Test } from '@nestjs/testing';
import { BoulderingRoundUnlimitedContestRankingService } from '../../src/bouldering/round/ranking/bouldering-round-unlimited-contest-ranking.service';
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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Bouldering unlimited contest ranking service (unit)', () => {
  let utils: TestUtils;
  let boulderingUnlimitedContestRankingService: BoulderingRoundUnlimitedContestRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingRoundUnlimitedContestRankingService],
    }).compile();

    boulderingUnlimitedContestRankingService = module.get(
      BoulderingRoundUnlimitedContestRankingService,
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
      data?.rankingType ?? BoulderingRoundRankingType.UNLIMITED_CONTEST,
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
    const user = new User(uuid.v4(), uuid.v4(), uuid.v4(), uuid.v4());
    user.id = utils.getRandomId();
    return user;
  }

  it('throws when getting rankings for an non unlimited contest round', () => {
    return expect(
      boulderingUnlimitedContestRankingService.getRankings(
        givenRound([], [], {
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('gets rankings', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();

    const boulders = [givenBoulder(0), givenBoulder(1)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
      }),
      givenResult(firstClimber, boulders[1], {
        top: false,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
      }),
      givenResult(secondClimber, boulders[1], {
        top: true,
      }),
    ];

    const round = givenRound(boulders, results);

    const {
      rankings,
      bouldersPoints,
      type,
    } = await boulderingUnlimitedContestRankingService.getRankings(round);

    expect(rankings).toHaveLength(2);
    expect(bouldersPoints).toHaveLength(2);
    expect(bouldersPoints[0]).toEqual(500);
    expect(bouldersPoints[1]).toEqual(1000);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);

    const firstClimberRanking = rankings.find(
      (r) => r.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climberId).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climberId).toEqual(secondClimber.id);

    expect(firstClimberRanking!.ranking).toEqual(2);
    expect(secondClimberRanking!.ranking).toEqual(1);

    expect(firstClimberRanking!.nbTops).toEqual(1);
    expect(secondClimberRanking!.nbTops).toEqual(2);

    expect(firstClimberRanking!.points).toEqual(500);
    expect(secondClimberRanking!.points).toEqual(1500);

    expect(firstClimberRanking!.tops).toEqual([true, false]);
    expect(secondClimberRanking!.tops).toEqual([true, true]);
  });

  it('gets rankings with ex-aequo', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();

    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
      }),
    ];

    const round = givenRound(boulders, results);

    const {
      rankings,
      bouldersPoints,
    } = await boulderingUnlimitedContestRankingService.getRankings(round);

    expect(rankings).toHaveLength(2);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(500);

    const firstClimberRanking = rankings.find(
      (r) => r.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climberId).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climberId).toEqual(secondClimber.id);

    expect(firstClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.ranking).toEqual(1);

    expect(firstClimberRanking!.nbTops).toEqual(1);
    expect(secondClimberRanking!.nbTops).toEqual(1);

    expect(firstClimberRanking!.points).toEqual(500);
    expect(secondClimberRanking!.points).toEqual(500);

    expect(firstClimberRanking!.tops).toEqual([true]);
    expect(secondClimberRanking!.tops).toEqual([true]);
  });

  it('gets rankings with non-topped boulder', async () => {
    const firstClimber = givenUser();
    const boulders = [givenBoulder(0)];
    const results = [givenResult(firstClimber, boulders[0])];

    const round = givenRound(boulders, results);

    const {
      rankings,
      bouldersPoints,
    } = await boulderingUnlimitedContestRankingService.getRankings(round);

    expect(rankings).toHaveLength(1);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(1000);

    const firstClimberRanking = rankings.find(
      (r) => r.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climberId).toEqual(firstClimber.id);
    expect(firstClimberRanking!.ranking).toEqual(1);
    expect(firstClimberRanking!.nbTops).toEqual(0);
    expect(firstClimberRanking!.points).toEqual(0);
    expect(firstClimberRanking!.tops).toEqual([false]);
  });

  it('shifts rankings after ex-aequos', async () => {
    const firstClimber = givenUser();
    const secondClimber = givenUser();
    const thirdClimber = givenUser();

    const boulders = [givenBoulder(0)];

    const results = [
      givenResult(firstClimber, boulders[0], {
        top: true,
      }),
      givenResult(secondClimber, boulders[0], {
        top: true,
      }),
      givenResult(thirdClimber, boulders[0], {
        top: false,
      }),
    ];

    const round = givenRound(boulders, results);

    const {
      rankings,
      bouldersPoints,
    } = await boulderingUnlimitedContestRankingService.getRankings(round);

    expect(rankings).toHaveLength(3);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(500);

    const firstClimberRanking = rankings.find(
      (r) => r.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climberId === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();

    const thirdClimberRanking = rankings.find(
      (r) => r.climberId === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();

    expect(firstClimberRanking!.climberId).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climberId).toEqual(secondClimber.id);
    expect(thirdClimberRanking!.climberId).toEqual(thirdClimber.id);

    expect(firstClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.ranking).toEqual(1);
    expect(thirdClimberRanking!.ranking).toEqual(3);
  });
});
