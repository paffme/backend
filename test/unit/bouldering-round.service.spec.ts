import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { Competition } from '../../src/competition/competition.entity';
import { BoulderingRoundService } from '../../src/bouldering/bouldering-round.service';
import {
  BoulderingRound,
  BoulderingRoundType,
} from '../../src/bouldering/bouldering-round.entity';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingRoundMapper } from '../../src/shared/mappers/bouldering-round.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { BoulderService } from '../../src/bouldering/boulder.service';
import { BoulderingResultService } from '../../src/bouldering/bouldering-result.service';
import { BoulderMapper } from '../../src/shared/mappers/boulder.mapper';

const boulderingRoundRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  find: jest.fn(),
};

const boulderingResultServiceMock: ServiceMock = {};

const boulderServiceMock: ServiceMock = {
  createMany: jest.fn(),
};

describe('Bouldering service (unit)', () => {
  let boulderingService: BoulderingRoundService;
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

    boulderingService = module.get(BoulderingRoundService);
    utils = new TestUtils();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a round', async () => {
    const competition = {} as Competition;

    const dto: CreateBoulderingRoundDto = {
      type: BoulderingRoundType.UNLIMITED_CONTEST,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
      index: 0,
    };

    const id = utils.getRandomId();

    boulderingRoundRepositoryMock.find.mockImplementation(() => []);

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async (roundInstance) => {
        roundInstance.id = id;
      },
    );

    const round = await boulderingService.createRound(competition, dto);
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
      type: BoulderingRoundType.UNLIMITED_CONTEST,
      quota: 0,
      name: 'SuperRound',
      boulders: 4,
    };

    boulderingRoundRepositoryMock.find.mockImplementation(() => []);

    boulderingRoundRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const round = await boulderingService.createRound(competition, dto);
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
      type: BoulderingRoundType.UNLIMITED_CONTEST,
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

    const round = await boulderingService.createRound(competition, dto);
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
});
