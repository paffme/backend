import { Test } from '@nestjs/testing';
import { BoulderingRankingService } from '../../../src/bouldering/ranking/bouldering-ranking.service';
import {
  BoulderingRound,
  BoulderingRoundRankings,
  BoulderingRoundRankingType,
} from '../../../src/bouldering/round/bouldering-round.entity';
import TestUtils from '../../utils';
import { CategoryName } from '../../../src/shared/types/category-name.enum';
import { Sex } from '../../../src/shared/types/sex.enum';
import * as uuid from 'uuid';
import { Competition } from '../../../src/competition/competition.entity';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { Collection } from 'mikro-orm';
import { givenClimberRankingInfos } from '../../fixture/climber-ranking-infos.fixture';
import { CompetitionRoundType } from '../../../src/competition/competition-round-type.enum';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';

describe('Bouldering round service (unit)', () => {
  let utils: TestUtils;
  let boulderingRankingService: BoulderingRankingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BoulderingRankingService],
    }).compile();

    boulderingRankingService = module.get(BoulderingRankingService);
    utils = new TestUtils();
  });

  function givenBoulderingRounds(
    ...data: [
      CompetitionRoundType,
      BoulderingRoundRankings,
      BoulderingGroup[],
    ][]
  ): BoulderingRound[] {
    const rounds = [];

    for (let i = 0; i < data.length; i++) {
      const d = data[i];

      const round = new BoulderingRound(
        CategoryName.Minime,
        Sex.Female,
        uuid.v4(),
        5,
        d[1].type,
        d[0],
        {} as Competition,
      );

      round.id = utils.getRandomId();

      round.groups = {
        count(): number {
          return d[2].length;
        },
        getItems(): BoulderingGroup[] {
          return d[2];
        },
      } as Collection<BoulderingGroup>;

      round.rankings = d[1];
      rounds.push(round);
    }

    return rounds;
  }

  it('returns a ranking with multiple rounds without ex-aequos', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, false, false],
              nbTops: 2,
              points: 100,
              ranking: 3,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(4),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [false, false, false, false],
              topsInTries: [0, 0, 0, 4],
              zones: [false, false, false, true],
              zonesInTries: [0, 0, 0, 1],
              ranking: 3,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 2, 3, 0],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 2, 3, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(3);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with ex-aequos (1)', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, false, false],
              nbTops: 2,
              points: 100,
              ranking: 3,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(4),
            },
          ],
        },
        [givenBoulderingGroup()],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [false, false, false, false],
              topsInTries: [0, 0, 0, 4],
              zones: [false, false, false, true],
              zonesInTries: [0, 0, 0, 1],
              ranking: 3,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(3);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with ex-aequos (2)', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, false, false],
              nbTops: 2,
              points: 100,
              ranking: 3,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(4),
            },
          ],
        },
        [givenBoulderingGroup()],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [false, false, false, false],
              topsInTries: [0, 0, 0, 4],
              zones: [false, false, false, true],
              zonesInTries: [0, 0, 0, 1],
              ranking: 3,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(3);
    expect(rankings.get(2)).toEqual(1);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with ex-aequos at the end', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(4),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 2,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(2);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(4);
  });

  it('returns a ranking with multiple rounds with multiple different ex-aequos', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(4),
            },
            {
              tops: [true, false, false, false],
              nbTops: 1,
              points: 50,
              ranking: 4,
              climber: givenClimberRankingInfos(5),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, false],
              zonesInTries: [1, 1, 1, 0],
              ranking: 3,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

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
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(2),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(2);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(1);
  });

  it('handles more than 2 ex-aequos', async () => {
    const rounds = givenBoulderingRounds([
      CompetitionRoundType.QUALIFIER,
      {
        type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        rankings: [
          {
            tops: [true, true, true, true],
            nbTops: 4,
            points: 200,
            ranking: 1,
            climber: givenClimberRankingInfos(1),
          },
          {
            tops: [true, true, true, false],
            nbTops: 3,
            points: 150,
            ranking: 2,
            climber: givenClimberRankingInfos(2),
          },
          {
            tops: [true, true, true, false],
            nbTops: 3,
            points: 150,
            ranking: 2,
            climber: givenClimberRankingInfos(3),
          },
          {
            tops: [true, true, true, false],
            nbTops: 3,
            points: 150,
            ranking: 2,
            climber: givenClimberRankingInfos(4),
          },
          {
            tops: [false, false, false, false],
            nbTops: 0,
            points: 0,
            ranking: 5,
            climber: givenClimberRankingInfos(5),
          },
        ],
      },
      [],
    ]);

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(5);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(2);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(2);
    expect(rankings.get(5)).toEqual(5);
  });

  it('returns an empty with no round', () => {
    const rounds: BoulderingRound[] = [];
    const rankings = boulderingRankingService.getRankings(rounds);
    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(0);
  });

  it('ignores a round if it has no rankings', () => {
    const rounds = givenBoulderingRounds([
      CompetitionRoundType.QUALIFIER,
      {
        type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        rankings: [
          {
            tops: [true, true, true, true],
            nbTops: 4,
            points: 200,
            ranking: 1,
            climber: givenClimberRankingInfos(1),
          },
        ],
      },
      [],
    ]);

    rounds.push(({
      type: CompetitionRoundType.FINAL,
      climbers: {
        count: (): number => 0,
      },
    } as unknown) as BoulderingRound);

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(1);
    expect(rankings.get(1)).toEqual(1);
  });

  it('should get results when the rankings does not change between rounds', async () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true, true, true],
              nbTops: 4,
              points: 200,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              nbTops: 3,
              points: 150,
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 2, 3, 4],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 2, 3, 0],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(2);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(2);
  });

  it('handles a competition with only one qualifier round', () => {
    const rounds = givenBoulderingRounds([
      CompetitionRoundType.QUALIFIER,
      {
        type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        rankings: [
          {
            tops: [true, true],
            nbTops: 2,
            points: 100,
            ranking: 1,
            climber: givenClimberRankingInfos(1),
          },
          {
            tops: [true, false],
            nbTops: 1,
            points: 50,
            ranking: 2,
            climber: givenClimberRankingInfos(2),
          },
          {
            tops: [true, true],
            nbTops: 2,
            points: 100,
            ranking: 1,
            climber: givenClimberRankingInfos(3),
          },
          {
            tops: [true, false],
            nbTops: 1,
            points: 50,
            ranking: 2,
            climber: givenClimberRankingInfos(4),
          },
        ],
      },
      [],
    ]);

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(4);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(3);
    expect(rankings.get(3)).toEqual(1);
    expect(rankings.get(4)).toEqual(3);
  });

  it('handles a competition with one qualifier round and one semi-final round', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true],
              nbTops: 2,
              points: 100,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, false],
              nbTops: 1,
              points: 50,
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true],
              nbTops: 2,
              points: 100,
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false],
              nbTops: 1,
              points: 50,
              ranking: 2,
              climber: givenClimberRankingInfos(4),
            },
            {
              tops: [false, false],
              nbTops: 0,
              points: 0,
              ranking: 3,
              climber: givenClimberRankingInfos(5),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(5);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(3);
    expect(rankings.get(3)).toEqual(1);
    expect(rankings.get(4)).toEqual(3);
    expect(rankings.get(5)).toEqual(5);
  });

  it('handles a competition with one qualification round, one semi-final round and one final round', () => {
    const rounds = givenBoulderingRounds(
      [
        CompetitionRoundType.QUALIFIER,
        {
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
          rankings: [
            {
              tops: [true, true],
              nbTops: 2,
              points: 100,
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, false],
              nbTops: 1,
              points: 50,
              ranking: 2,
              climber: givenClimberRankingInfos(2),
            },
            {
              tops: [true, true],
              nbTops: 2,
              points: 100,
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
            {
              tops: [true, false],
              nbTops: 1,
              points: 50,
              ranking: 2,
              climber: givenClimberRankingInfos(4),
            },
            {
              tops: [false, false],
              nbTops: 0,
              points: 0,
              ranking: 3,
              climber: givenClimberRankingInfos(5),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.SEMI_FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
      [
        CompetitionRoundType.FINAL,
        {
          type: BoulderingRoundRankingType.CIRCUIT,
          rankings: [
            {
              tops: [true, true, true, true],
              topsInTries: [1, 1, 1, 1],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 1,
              climber: givenClimberRankingInfos(1),
            },
            {
              tops: [true, true, true, false],
              topsInTries: [1, 1, 1, 0],
              zones: [true, true, true, true],
              zonesInTries: [1, 1, 1, 1],
              ranking: 2,
              climber: givenClimberRankingInfos(3),
            },
          ],
        },
        [],
      ],
    );

    const rankings = boulderingRankingService.getRankings(rounds);

    expect(rankings).toBeInstanceOf(Map);
    expect(rankings.size).toEqual(5);
    expect(rankings.get(1)).toEqual(1);
    expect(rankings.get(2)).toEqual(3);
    expect(rankings.get(3)).toEqual(2);
    expect(rankings.get(4)).toEqual(3);
    expect(rankings.get(5)).toEqual(5);
  });
});
