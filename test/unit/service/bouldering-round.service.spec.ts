import { Test } from '@nestjs/testing';
import { Competition } from '../../../src/competition/competition.entity';
import { BoulderingRoundService } from '../../../src/bouldering/round/bouldering-round.service';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
  BoulderingRoundUnlimitedContestRankings,
} from '../../../src/bouldering/round/bouldering-round.entity';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingRoundMapper } from '../../../src/shared/mappers/bouldering-round.mapper';
import { RepositoryMock, ServiceMock } from '../mocks/types';
import { CreateBoulderingRoundDto } from '../../../src/competition/dto/in/body/create-bouldering-round.dto';
import { BoulderService } from '../../../src/bouldering/boulder/boulder.service';
import { BoulderingResultService } from '../../../src/bouldering/result/bouldering-result.service';
import { BoulderMapper } from '../../../src/shared/mappers/boulder.mapper';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BoulderingRoundUnlimitedContestRankingService } from '../../../src/bouldering/round/ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from '../../../src/bouldering/round/ranking/bouldering-round-counted-ranking.service';
import { Sex } from '../../../src/shared/types/sex.enum';
import { CategoryName } from '../../../src/shared/types/category-name.enum';
import { BoulderingGroupService } from '../../../src/bouldering/group/bouldering-group.service';
import { BoulderingGroupMapper } from '../../../src/shared/mappers/bouldering-group.mapper';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import { CreateBoulderDto } from '../../../src/competition/dto/in/body/create-boulder.dto';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';
import { Collection } from 'mikro-orm';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { InitOptions } from 'mikro-orm/dist/entity/Collection';
import { givenCompetition } from '../../fixture/competition.fixture';
import { CompetitionType } from '../../../src/competition/types/competition-type.enum';
import { CreateBoulderingGroupDto } from '../../../src/competition/dto/in/body/create-bouldering-group.dto';

const boulderingRoundRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const boulderingResultServiceMock: ServiceMock = {};

const boulderingGroupServiceMock: ServiceMock = {
  create: jest.fn(),
};

const boulderingUnlimitedContestRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const boulderingRoundCountedRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const boulderServiceMock: ServiceMock = {
  createMany: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

describe('Bouldering round service (unit)', () => {
  let boulderingRoundService: BoulderingRoundService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderingRoundService,
        {
          provide: getRepositoryToken(BoulderingRound),
          useFactory: (): typeof boulderingRoundRepositoryMock =>
            boulderingRoundRepositoryMock,
        },
        {
          provide: BoulderingResultService,
          useFactory: (): typeof boulderingResultServiceMock =>
            boulderingResultServiceMock,
        },
        {
          provide: BoulderService,
          useFactory: (): typeof boulderServiceMock => boulderServiceMock,
        },
        {
          provide: BoulderingRoundUnlimitedContestRankingService,
          useFactory: (): typeof boulderingUnlimitedContestRankingServiceMock =>
            boulderingUnlimitedContestRankingServiceMock,
        },
        {
          provide: BoulderingRoundCountedRankingService,
          useFactory: (): typeof boulderingRoundCountedRankingServiceMock =>
            boulderingRoundCountedRankingServiceMock,
        },
        {
          provide: BoulderingGroupService,
          useFactory: (): typeof boulderingGroupServiceMock =>
            boulderingGroupServiceMock,
        },
        {
          provide: BoulderingRoundMapper,
          useClass: BoulderingRoundMapper,
        },
        {
          provide: BoulderMapper,
          useClass: BoulderMapper,
        },
        {
          provide: BoulderingGroupMapper,
          useClass: BoulderingGroupMapper,
        },
      ],
    }).compile();

    boulderingRoundService = module.get(BoulderingRoundService);
  });

  it('should get an existing round', async () => {
    const round = {};
    boulderingRoundRepositoryMock.findOne.mockImplementation(async () => round);

    const res = await boulderingRoundService.getOrFail(123);

    expect(res).toBe(round);
    expect(boulderingRoundRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderingRoundRepositoryMock.findOne).toHaveBeenCalledWith(
      123,
      undefined,
    );
  });

  it('throws not found when getting an unknown round', () => {
    boulderingRoundRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    return expect(boulderingRoundService.getOrFail(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should not create a non-circuit round for a semi-final', async () => {
    const competition = {} as Competition;

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.SEMI_FINAL,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
      sex: Sex.Female,
      category: CategoryName.Minime,
    };

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should not create a non-circuit round for a final', async () => {
    const competition = {} as Competition;

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.FINAL,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
      sex: Sex.Female,
      category: CategoryName.Minime,
    };

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates rankings for an unlimited contest', async () => {
    const round = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    } as BoulderingRound;

    const rankings = {} as BoulderingRoundUnlimitedContestRankings;

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderingUnlimitedContestRankingServiceMock.getRankings.mockImplementation(
      () => rankings,
    );

    const res = await boulderingRoundService.updateRankings(round);

    expect(res).toBeUndefined();
    expect(round.rankings).toBe(rankings);

    expect(
      boulderingUnlimitedContestRankingServiceMock.getRankings,
    ).toHaveBeenCalledTimes(1);

    expect(
      boulderingUnlimitedContestRankingServiceMock.getRankings,
    ).toHaveBeenCalledWith(round);

    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      round,
    );
  });

  it('updates rankings for a limited contest', async () => {
    const round = {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    } as BoulderingRound;

    const rankings = {} as BoulderingRoundUnlimitedContestRankings;

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderingRoundCountedRankingServiceMock.getRankings.mockImplementation(
      () => rankings,
    );

    const res = await boulderingRoundService.updateRankings(round);

    expect(res).toBeUndefined();
    expect(round.rankings).toBe(rankings);

    expect(
      boulderingRoundCountedRankingServiceMock.getRankings,
    ).toHaveBeenCalledTimes(1);

    expect(
      boulderingRoundCountedRankingServiceMock.getRankings,
    ).toHaveBeenCalledWith(round);

    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      round,
    );
  });

  it('updates rankings for a circuit', async () => {
    const round = {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    } as BoulderingRound;

    const rankings = {} as BoulderingRoundUnlimitedContestRankings;

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderingRoundCountedRankingServiceMock.getRankings.mockImplementation(
      () => rankings,
    );

    const res = await boulderingRoundService.updateRankings(round);

    expect(res).toBeUndefined();
    expect(round.rankings).toBe(rankings);

    expect(
      boulderingRoundCountedRankingServiceMock.getRankings,
    ).toHaveBeenCalledTimes(1);

    expect(
      boulderingRoundCountedRankingServiceMock.getRankings,
    ).toHaveBeenCalledWith(round);

    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      round,
    );
  });

  it('throws when adding a round with multiple groups when it is not a circuit', async () => {
    const competition = {} as Competition;

    const dto = {
      type: BoulderingRoundType.QUALIFIER,
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      groups: 2,
    } as CreateBoulderingRoundDto;

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when adding a round with multiple groups when it is not a qualifier', async () => {
    const competition = {} as Competition;

    const dto = {
      type: BoulderingRoundType.FINAL,
      rankingType: BoulderingRoundRankingType.CIRCUIT,
      groups: 2,
    } as CreateBoulderingRoundDto;

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  function givenRoundWithOneGroup(): {
    group: BoulderingGroup;
    round: BoulderingRound;
  } {
    const group = givenBoulderingGroup();
    const round = givenBoulderingRound(
      undefined,
      undefined,
      undefined,
      undefined,
      {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        async init(
          options: InitOptions<BoulderingGroup>,
        ): Promise<Partial<Collection<BoulderingGroup>>> {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          expect(options.where.id).toEqual(group.id);

          return {
            getItems(): BoulderingGroup[] {
              return [group];
            },
          };
        },
      },
    );

    return {
      group,
      round,
    };
  }

  it('creates a boulder', async () => {
    const { group, round } = givenRoundWithOneGroup();
    const dto: CreateBoulderDto = {};
    const fakeBoulder = {};

    boulderServiceMock.create.mockImplementation(async () => fakeBoulder);

    const result = await boulderingRoundService.createBoulder(
      round,
      group.id,
      dto,
    );

    expect(result).toBe(fakeBoulder);
    expect(boulderServiceMock.create).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.create).toHaveBeenCalledWith(group, dto);
  });

  function givenRoundWithNoGroups(): BoulderingRound {
    return givenBoulderingRound(undefined, undefined, undefined, undefined, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      async init(): Promise<Partial<Collection<BoulderingGroup>>> {
        return {
          getItems(): BoulderingGroup[] {
            return [];
          },
        };
      },
    });
  }

  it('throws when adding a boulder to unknown group', () => {
    const round = givenRoundWithNoGroups();
    const dto: CreateBoulderDto = {};

    return expect(
      boulderingRoundService.createBoulder(round, 1, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a boulder', async () => {
    const { group, round } = givenRoundWithOneGroup();
    boulderServiceMock.remove.mockImplementation(async () => undefined);

    await boulderingRoundService.removeBoulder(round, group.id, 2);

    expect(boulderServiceMock.remove).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.remove).toHaveBeenCalledWith(group, 2);
  });

  it('throws not found when removing a boulder of an unknown round', () => {
    const round = givenRoundWithNoGroups();

    return expect(
      boulderingRoundService.removeBoulder(round, 1, 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should not allow to create a limited contest round without maxTries defined', () => {
    const competition = givenCompetition({
      type: CompetitionType.Bouldering,
    });

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
      sex: Sex.Female,
      category: CategoryName.Minime,
      maxTries: undefined,
    };

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('creates a group', async () => {
    const round = givenBoulderingRound();
    const dto: CreateBoulderingGroupDto = {
      name: 'anee',
    };
    const fakeGroup = {};

    boulderingGroupServiceMock.create.mockImplementation(async () => fakeGroup);

    const result = await boulderingRoundService.createGroup(round, dto);

    expect(result).toBe(fakeGroup);
    expect(boulderingGroupServiceMock.create).toHaveBeenCalledTimes(1);
    expect(boulderingGroupServiceMock.create).toHaveBeenCalledWith(
      dto.name,
      round,
    );
  });
});
