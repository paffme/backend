import { Test } from '@nestjs/testing';
import {
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../../src/bouldering/round/bouldering-round.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { BoulderingRoundCountedRankingService } from '../../../src/bouldering/round/ranking/bouldering-round-counted-ranking.service';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import { givenUser } from '../../fixture/user.fixture';
import { givenBoulder } from '../../fixture/boulder.fixture';
import { givenResult } from '../../fixture/bouldering-result.fixture';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('Bouldering counted ranking service (unit)', () => {
  let boulderingRoundCountedRankingService: BoulderingRoundCountedRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingRoundCountedRankingService],
    }).compile();

    boulderingRoundCountedRankingService = module.get(
      BoulderingRoundCountedRankingService,
    );
  });

  it('throws when getting rankings for an non counted round', () => {
    return expect(() =>
      boulderingRoundCountedRankingService.getRankings(
        givenBoulderingRound(
          {
            rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          },
          [],
          [],
        ),
      ),
    ).toThrow(InternalServerErrorException);
  });

  it('gets rankings for a circuit', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      },
      boulders,
      results,
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(groups).toHaveLength(1);
    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);
    expect(firstClimberRanking!.tops).toEqual([true, false]);
    expect(firstClimberRanking!.topsInTries).toEqual([10, 0]);
    expect(firstClimberRanking!.zones).toEqual([true, true]);
    expect(firstClimberRanking!.zonesInTries).toEqual([5, 3]);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.tops).toEqual([true, true]);
    expect(secondClimberRanking!.topsInTries).toEqual([1, 3]);
    expect(secondClimberRanking!.zones).toEqual([true, true]);
    expect(secondClimberRanking!.zonesInTries).toEqual([1, 1]);
  });

  it('gets rankings for a limited contest', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(groups).toHaveLength(1);
    expect(type).toEqual(BoulderingRoundRankingType.LIMITED_CONTEST);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);
    expect(firstClimberRanking!.tops).toEqual([true, false]);
    expect(firstClimberRanking!.topsInTries).toEqual([10, 0]);
    expect(firstClimberRanking!.zones).toEqual([true, true]);
    expect(firstClimberRanking!.zonesInTries).toEqual([5, 3]);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
    expect(secondClimberRanking!.tops).toEqual([true, true]);
    expect(secondClimberRanking!.topsInTries).toEqual([1, 3]);
    expect(secondClimberRanking!.zones).toEqual([true, true]);
    expect(secondClimberRanking!.zonesInTries).toEqual([1, 1]);
  });

  it('sorts rankings by tops (1)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops (2)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones (1)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones (2)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones then by top in tries (1)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones then by top in tries (2)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('sorts rankings by tops then by zones then by top in tries then by zone in tries (1)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('sorts rankings by tops then by zones then by top in tries then by zone in tries (2)', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('handles ex-aequo', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('handles ex-aequo with no tops and no zones', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('shifts rankings after ex-aequos', () => {
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(3);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);

    const thirdClimberRanking = rankings.find(
      (c) => c.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);
  });

  it('handles equality for the podium climbers in a final by using the number of tops in the first try, second try, etc... (1)', () => {
    const firstClimber = givenUser({
      id: 0,
    });
    const secondClimber = givenUser({
      id: 1,
    });
    const thirdClimber = givenUser({
      id: 2,
    });
    const fourthClimber = givenUser({
      id: 3,
    });
    const fifthClimber = givenUser({
      id: 4,
    });

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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);

    const thirdClimberRanking = rankings.find(
      (c) => c.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climber.id === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(4);

    const fifthClimberRanking = rankings.find(
      (c) => c.climber.id === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(4);
  });

  it('handles equality for the podium climbers in a final by using the number of tops in the first try, second try, etc... (2)', () => {
    const firstClimber = givenUser({
      id: 0,
    });
    const secondClimber = givenUser({
      id: 1,
    });
    const thirdClimber = givenUser({
      id: 2,
    });
    const fourthClimber = givenUser({
      id: 3,
    });
    const fifthClimber = givenUser({
      id: 4,
    });

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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(4);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(4);

    const thirdClimberRanking = rankings.find(
      (c) => c.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climber.id === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(2);

    const fifthClimberRanking = rankings.find(
      (c) => c.climber.id === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(1);
  });

  it('handles equality for the podium climbers in a final by using the number of zones in the first try, second try, etc... (1)', () => {
    const firstClimber = givenUser({
      id: 0,
    });
    const secondClimber = givenUser({
      id: 1,
    });
    const thirdClimber = givenUser({
      id: 2,
    });
    const fourthClimber = givenUser({
      id: 3,
    });
    const fifthClimber = givenUser({
      id: 4,
    });

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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);

    const thirdClimberRanking = rankings.find(
      (c) => c.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climber.id === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(4);

    const fifthClimberRanking = rankings.find(
      (c) => c.climber.id === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(4);
  });

  it('handles equality for the podium climbers in a final by using the number of zones in the first try, second try, etc... (2)', () => {
    const firstClimber = givenUser({
      id: 0,
    });
    const secondClimber = givenUser({
      id: 1,
    });
    const thirdClimber = givenUser({
      id: 2,
    });
    const fourthClimber = givenUser({
      id: 3,
    });
    const fifthClimber = givenUser({
      id: 4,
    });

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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(5);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(4);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(4);

    const thirdClimberRanking = rankings.find(
      (c) => c.climber.id === thirdClimber.id,
    );

    expect(thirdClimberRanking).toBeTruthy();
    expect(thirdClimberRanking!.ranking).toEqual(3);

    const fourthClimberRanking = rankings.find(
      (c) => c.climber.id === fourthClimber.id,
    );

    expect(fourthClimberRanking).toBeTruthy();
    expect(fourthClimberRanking!.ranking).toEqual(2);

    const fifthClimberRanking = rankings.find(
      (c) => c.climber.id === fifthClimber.id,
    );

    expect(fifthClimberRanking).toBeTruthy();
    expect(fifthClimberRanking!.ranking).toEqual(1);
  });

  it('handles equality for the podium climbers and let them ex-aequo if they cannot be separated', () => {
    const firstClimber = givenUser({
      id: 0,
    });
    const secondClimber = givenUser({
      id: 1,
    });

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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups } = boulderingRoundCountedRankingService.getRankings(round);

    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
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

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);
    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(2);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(1);
  });

  it('does not put climbers in rankings if there are no results in a qualification round', () => {
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
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.QUALIFIER,
      },
      boulders,
      results,
      [firstClimber, secondClimber],
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);
    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(1);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);
  });

  it('puts climbers in last position without any results when it is a semi-final round', () => {
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
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.SEMI_FINAL,
      },
      boulders,
      results,
      [firstClimber, secondClimber],
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);
    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });

  it('puts climbers in last position without any results when it is a final round', () => {
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
        rankingType: BoulderingRoundRankingType.CIRCUIT,
        type: BoulderingRoundType.FINAL,
      },
      boulders,
      results,
      [firstClimber, secondClimber],
    );

    const { groups, type } = boulderingRoundCountedRankingService.getRankings(
      round,
    );

    expect(type).toEqual(BoulderingRoundRankingType.CIRCUIT);
    expect(groups).toHaveLength(1);

    const rankings = groups[0].rankings;
    expect(rankings).toHaveLength(2);

    const firstClimberRanking = rankings.find(
      (c) => c.climber.id === firstClimber.id,
    );

    expect(firstClimberRanking).toBeTruthy();
    expect(firstClimberRanking!.ranking).toEqual(1);

    const secondClimberRanking = rankings.find(
      (c) => c.climber.id === secondClimber.id,
    );

    expect(secondClimberRanking).toBeTruthy();
    expect(secondClimberRanking!.ranking).toEqual(2);
  });
});
