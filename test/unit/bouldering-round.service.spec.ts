import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { Competition } from '../../src/competition/competition.entity';
import { BoulderingRoundService } from '../../src/bouldering/bouldering-round.service';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/bouldering-round.entity';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingRoundMapper } from '../../src/shared/mappers/bouldering-round.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { BoulderService } from '../../src/bouldering/boulder.service';
import { BoulderingResultService } from '../../src/bouldering/bouldering-result.service';
import { BoulderMapper } from '../../src/shared/mappers/boulder.mapper';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

const boulderingRoundRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const boulderingResultServiceMock: ServiceMock = {};

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
    expect(boulderingRoundRepositoryMock.findOne).toHaveBeenCalledWith(123);
  });

  it('throws not found when getting an unknown round', () => {
    boulderingRoundRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    return expect(boulderingRoundService.getOrFail(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should create a round', async () => {
    const competition = {} as Competition;

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
    };

    const id = utils.getRandomId();

    boulderingRoundRepositoryMock.find.mockImplementation(async () => []);

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async (roundInstance) => {
        roundInstance.id = id;
      },
    );

    const round = await boulderingRoundService.createRound(competition, dto);
    expect(round.index).toEqual(dto.index);
    expect(round.name).toEqual(dto.name);
    expect(round.id).toEqual(id);

    expect(boulderServiceMock.createMany).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.createMany).toHaveBeenCalledWith(
      round,
      dto.boulders,
    );

    expect(boulderingRoundRepositoryMock.find).toHaveBeenCalledTimes(1);
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should create a round and put it at the last one if no index is specified', async () => {
    const competition = ({
      boulderingRounds: {
        count(): number {
          return 1;
        },
      },
    } as unknown) as Competition;

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
    };

    boulderingRoundRepositoryMock.find.mockImplementation(() => []);

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const round = await boulderingRoundService.createRound(competition, dto);
    expect(round.index).toEqual(1);

    expect(boulderServiceMock.createMany).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.createMany).toHaveBeenCalledWith(
      round,
      dto.boulders,
    );

    expect(boulderingRoundRepositoryMock.find).toHaveBeenCalledTimes(1);
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should create a round and shift other rounds', async () => {
    const competition = {} as Competition;

    const dto: CreateBoulderingRoundDto = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      type: BoulderingRoundType.QUALIFIER,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
    };

    const firstRound = {
      index: 0,
    };

    boulderingRoundRepositoryMock.find.mockImplementation(() => [firstRound]);

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    boulderingRoundRepositoryMock.persistLater.mockImplementation(
      () => undefined,
    );

    const round = await boulderingRoundService.createRound(competition, dto);
    expect(round.index).toEqual(dto.index);

    expect(boulderServiceMock.createMany).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.createMany).toHaveBeenCalledWith(
      round,
      dto.boulders,
    );

    expect(boulderingRoundRepositoryMock.find).toHaveBeenCalledTimes(1);
    expect(boulderingRoundRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );

    expect(boulderingRoundRepositoryMock.persistLater).toHaveBeenCalledWith(
      firstRound,
    );

    expect(firstRound.index).toEqual(1);
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
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      } as BoulderingRound),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      } as BoulderingRound),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      } as BoulderingRound),
    ).toEqual(false);
  });

  it('returns correctly competitions with counted zones', () => {
    expect(
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      } as BoulderingRound),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
      } as BoulderingRound),
    ).toEqual(true);

    expect(
      BoulderingRoundService.isRoundWithCountedTries({
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      } as BoulderingRound),
    ).toEqual(false);
  });
});
