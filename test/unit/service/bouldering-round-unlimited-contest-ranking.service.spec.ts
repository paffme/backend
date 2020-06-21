import { Test } from '@nestjs/testing';
import { BoulderingRoundRankingType } from '../../../src/bouldering/round/bouldering-round.entity';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import { givenUser } from '../../fixture/user.fixture';
import { givenBoulder } from '../../fixture/boulder.fixture';
import { givenResult } from '../../fixture/bouldering-result.fixture';
import { CompetitionRoundType } from '../../../src/competition/competition-round-type.enum';
import { BoulderingGroupUnlimitedContestRankingService } from '../../../src/bouldering/group/ranking/bouldering-group-unlimited-contest-ranking.service';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Bouldering unlimited contest ranking service (unit)', () => {
  let boulderingUnlimitedContestRankingService: BoulderingGroupUnlimitedContestRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingGroupUnlimitedContestRankingService],
    }).compile();

    boulderingUnlimitedContestRankingService = module.get(
      BoulderingGroupUnlimitedContestRankingService,
    );
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

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          type: CompetitionRoundType.QUALIFIER,
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      },
      boulders,
      [firstClimber, secondClimber],
      results,
    );

    const {
      rankings,
      bouldersPoints,
      type,
    } = await boulderingUnlimitedContestRankingService.getRankings(group);

    expect(rankings).toHaveLength(2);
    expect(bouldersPoints).toHaveLength(2);
    expect(bouldersPoints[0]).toEqual(500);
    expect(bouldersPoints[1]).toEqual(1000);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);

    const firstClimberRanking = rankings.find(
      (r) => r.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climber.id).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climber.id).toEqual(secondClimber.id);

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

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          type: CompetitionRoundType.QUALIFIER,
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      },
      boulders,
      [firstClimber, secondClimber],
      results,
    );

    const {
      rankings,
      bouldersPoints,
      type,
    } = boulderingUnlimitedContestRankingService.getRankings(group);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(rankings).toHaveLength(2);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(500);

    const firstClimberRanking = rankings.find(
      (r) => r.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climber.id).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climber.id).toEqual(secondClimber.id);

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

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          type: CompetitionRoundType.QUALIFIER,
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      },
      boulders,
      [firstClimber],
      results,
    );

    const {
      rankings,
      bouldersPoints,
      type,
    } = boulderingUnlimitedContestRankingService.getRankings(group);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(rankings).toHaveLength(1);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(1000);

    const firstClimberRanking = rankings.find(
      (r) => r.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.climber.id).toEqual(firstClimber.id);
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

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          type: CompetitionRoundType.QUALIFIER,
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      },
      boulders,
      [firstClimber, secondClimber, thirdClimber],
      results,
    );

    const {
      rankings,
      bouldersPoints,
      type,
    } = boulderingUnlimitedContestRankingService.getRankings(group);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(rankings).toHaveLength(3);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(500);

    const firstClimberRanking = rankings.find(
      (r) => r.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();

    const secondClimberRanking = rankings.find(
      (r) => r.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();

    const thirdClimberRanking = rankings.find(
      (r) => r.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();

    expect(firstClimberRanking!.climber.id).toEqual(firstClimber.id);
    expect(secondClimberRanking!.climber.id).toEqual(secondClimber.id);
    expect(thirdClimberRanking!.climber.id).toEqual(thirdClimber.id);

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

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          type: CompetitionRoundType.QUALIFIER,
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
      },
      boulders,
      [firstClimber, secondClimber],
      results,
    );

    const {
      rankings,
      bouldersPoints,
      type,
    } = boulderingUnlimitedContestRankingService.getRankings(group);

    expect(type).toEqual(BoulderingRoundRankingType.UNLIMITED_CONTEST);
    expect(rankings).toHaveLength(1);
    expect(bouldersPoints).toHaveLength(1);
    expect(bouldersPoints[0]).toEqual(1000);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);
  });
});
