import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { Competition } from '../../src/competition/competition.entity';
import { BoulderingRoundService } from '../../src/bouldering/round/bouldering-round.service';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
  BoulderingRoundUnlimitedContestRankings,
} from '../../src/bouldering/round/bouldering-round.entity';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingRoundMapper } from '../../src/shared/mappers/bouldering-round.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { BoulderingResultService } from '../../src/bouldering/result/bouldering-result.service';
import { BoulderMapper } from '../../src/shared/mappers/boulder.mapper';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BoulderingRoundUnlimitedContestRankingService } from '../../src/bouldering/round/ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from '../../src/bouldering/round/ranking/bouldering-round-counted-ranking.service';

const boulderingRoundRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const boulderingResultServiceMock: ServiceMock = {};

const boulderingUnlimitedContestRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const boulderingRoundCountedRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const boulderServiceMock: ServiceMock = {
  createMany: jest.fn(),
};

describe('Bouldering round service (unit)', () => {
  let boulderingRoundService: BoulderingRoundService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderingRoundService,
        {
          provide: getRepositoryToken(BoulderingRound),
          useFactory: () => boulderingRoundRepositoryMock,
        },
        {
          provide: BoulderingResultService,
          useFactory: () => boulderingResultServiceMock,
        },
        {
          provide: BoulderService,
          useFactory: () => boulderServiceMock,
        },
        {
          provide: BoulderingRoundUnlimitedContestRankingService,
          useFactory: () => boulderingUnlimitedContestRankingServiceMock,
        },
        {
          provide: BoulderingRoundCountedRankingService,
          useFactory: () => boulderingRoundCountedRankingServiceMock,
        },
        {
          provide: BoulderingRoundMapper,
          useClass: BoulderingRoundMapper,
        },
        {
          provide: BoulderMapper,
          useClass: BoulderMapper,
        },
      ],
    }).compile();

    boulderingRoundService = module.get(BoulderingRoundService);
    utils = new TestUtils();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    };

    return expect(
      boulderingRoundService.createRound(competition, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('returns correctly competitions with counted tries', () => {
    expect(
      BoulderingRoundService.isRankingWithCountedTries(
        BoulderingRoundRankingType.CIRCUIT,
      ),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRankingWithCountedTries(
        BoulderingRoundRankingType.LIMITED_CONTEST,
      ),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRankingWithCountedTries(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      ),
    ).toEqual(false);
  });

  it('returns correctly competitions with counted zones', () => {
    expect(
      BoulderingRoundService.isRankingWithCountedZones(
        BoulderingRoundRankingType.CIRCUIT,
      ),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRankingWithCountedZones(
        BoulderingRoundRankingType.LIMITED_CONTEST,
      ),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRankingWithCountedZones(
        BoulderingRoundRankingType.UNLIMITED_CONTEST,
      ),
    ).toEqual(false);
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
      async () => rankings,
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
      async () => rankings,
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
      async () => rankings,
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
});
