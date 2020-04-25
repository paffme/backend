import { Test } from '@nestjs/testing';
import { BoulderingRoundUnlimitedContestRankingService } from '../../src/bouldering/round/ranking/bouldering-round-unlimited-contest-ranking.service';
import {
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import { InternalServerErrorException } from '@nestjs/common';
import TestUtils from '../utils';
import { givenBoulderingRound } from '../fixture/bouldering-round.fixture';
import { givenUser } from '../fixture/user.fixture';
import { givenBoulder } from '../fixture/boulder.fixture';
import { givenResult } from '../fixture/bouldering-result.fixture';

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

  it('throws when getting rankings for an non unlimited contest round', () => {
    return expect(() =>
      boulderingUnlimitedContestRankingService.getRankings(
        givenBoulderingRound(
          {
            rankingType: BoulderingRoundRankingType.CIRCUIT,
          },
          [],
          [],
        ),
      ),
    ).toThrow(InternalServerErrorException);
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

    const round = givenBoulderingRound(
      {
        type: BoulderingRoundType.QUALIFIER,
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const {
      groups,
      type,
    } = await boulderingUnlimitedContestRankingService.getRankings(round);

    expect(groups).toHaveLength(1);
    const { rankings, bouldersPoints } = groups[0];

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

  it('gets rankings with ex-aequo', () => {
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

    const round = givenBoulderingRound(
      {
        type: BoulderingRoundType.QUALIFIER,
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingUnlimitedContestRankingService.getRankings(
      round,
    );

    expect(groups).toHaveLength(1);
    const { rankings, bouldersPoints } = groups[0];

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

  it('gets rankings with non-topped boulder', () => {
    const firstClimber = givenUser();
    const boulders = [givenBoulder(0)];
    const results = [givenResult(firstClimber, boulders[0])];

    const round = givenBoulderingRound(
      {
        type: BoulderingRoundType.QUALIFIER,
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingUnlimitedContestRankingService.getRankings(
      round,
    );

    expect(groups).toHaveLength(1);
    const { rankings, bouldersPoints } = groups[0];

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

  it('shifts rankings after ex-aequos', () => {
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

    const round = givenBoulderingRound(
      {
        type: BoulderingRoundType.QUALIFIER,
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingUnlimitedContestRankingService.getRankings(
      round,
    );

    expect(groups).toHaveLength(1);
    const { rankings, bouldersPoints } = groups[0];

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

  it('does not put climbers in rankings if there are no results', () => {
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
    ];

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        type: BoulderingRoundType.QUALIFIER,
      },
      boulders,
      results,
      [firstClimber, secondClimber],
    );

    const {
      groups,
      type,
    } = boulderingUnlimitedContestRankingService.getRankings(round);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(1);

    const firstClimberRanking = rankings.find(
      (c) => c.climberId === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);
  });
});
