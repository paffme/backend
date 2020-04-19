import TestUtils from '../utils';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingResultService } from '../../src/bouldering/result/bouldering-result.service';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { RepositoryMock } from './mocks/types';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../../src/bouldering/round/bouldering-round.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { User } from '../../src/user/user.entity';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import { UnprocessableEntityException } from '@nestjs/common';

const boulderingResultRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  findOne: jest.fn(),
};

describe('Bouldering result service (unit)', () => {
  let boulderingResultService: BoulderingResultService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderingResultService,
        {
          provide: getRepositoryToken(BoulderingResult),
          useFactory: () => boulderingResultRepositoryMock,
        },
      ],
    }).compile();

    boulderingResultService = module.get(BoulderingResultService);
    utils = new TestUtils();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new instance', () => {
    const round = {} as BoulderingRound;
    const boulder = {} as Boulder;
    const user = {} as User;

    boulderingResultRepositoryMock.persistLater.mockImplementation(
      () => undefined,
    );

    const instance = boulderingResultService.createNewInstance(
      round,
      boulder,
      user,
    );

    expect(instance.climber).toBe(user);
    expect(instance.round).toBe(round);
    expect(instance.boulder).toBe(boulder);
    expect(instance.boulder).toBe(boulder);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      1,
    );

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledWith(
      instance,
    );
  });

  it('getOrCreateNewInstance gets a new instance', async () => {
    const round = {} as BoulderingRound;
    const boulder = {} as Boulder;
    const user = {} as User;

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    boulderingResultRepositoryMock.persistLater.mockImplementation(
      () => undefined,
    );

    const instance = await boulderingResultService.getOrCreateNewInstance(
      round,
      boulder,
      user,
    );

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      round,
      boulder,
    });

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      1,
    );

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledWith(
      instance,
    );
  });

  it('getOrCreateNewInstance gets a already existing instance', async () => {
    const round = {} as BoulderingRound;
    const boulder = {} as Boulder;
    const user = {} as User;

    const instance = {} as BoulderingResult;

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.getOrCreateNewInstance(
      round,
      boulder,
      user,
    );

    expect(res).toBe(instance);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      round,
      boulder,
    });

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      0,
    );
  });

  it('adds a result for a unlimited contest', async () => {
    const boulder = {} as Boulder;
    const instance = {} as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      top: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(true);
    expect(res).not.toHaveProperty('tries');
    expect(res).not.toHaveProperty('zone');
    expect(res).not.toHaveProperty('zoneInTries');
    expect(res).not.toHaveProperty('topInTries');

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      round,
      boulder,
    });

    expect(
      boulderingResultRepositoryMock.persistAndFlush,
    ).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      instance,
    );
  });

  it('adds a result for a limited contest', async () => {
    const boulder = {} as Boulder;

    const instance = {
      zoneInTries: 0,
      topInTries: 0,
      tries: 0,
    } as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      try: true,
      top: true,
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(true);
    expect(res.tries).toEqual(1);
    expect(res.zone).toEqual(true);
    expect(res.zoneInTries).toEqual(1);
    expect(res.topInTries).toEqual(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      round,
      boulder,
    });

    expect(
      boulderingResultRepositoryMock.persistAndFlush,
    ).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      instance,
    );
  });

  it('adds a result for a circuit', async () => {
    const boulder = {} as Boulder;

    const instance = {
      zoneInTries: 0,
      topInTries: 0,
      tries: 0,
    } as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      try: true,
      top: true,
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(true);
    expect(res.tries).toEqual(1);
    expect(res.zone).toEqual(true);
    expect(res.zoneInTries).toEqual(1);
    expect(res.topInTries).toEqual(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      round,
      boulder,
    });

    expect(
      boulderingResultRepositoryMock.persistAndFlush,
    ).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      instance,
    );
  });

  it('throws when adding a try to a non counted tries round', () => {
    const boulder = {} as Boulder;
    const instance = {} as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      try: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    return expect(
      boulderingResultService.addResult(round, boulder, user, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when adding a zone to a non counted zones round', () => {
    const boulder = {} as Boulder;
    const instance = {} as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    return expect(
      boulderingResultService.addResult(round, boulder, user, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('resets topInTries when removing a top', async () => {
    const boulder = {} as Boulder;

    const instance = {
      tries: 10,
      topInTries: 10,
      top: true,
      zone: true,
      zoneInTries: 5,
    } as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      top: false,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(false);
    expect(res.tries).toEqual(10);
    expect(res.zone).toEqual(true);
    expect(res.zoneInTries).toEqual(5);
    expect(res.topInTries).toEqual(0);
  });

  it('resets zoneInTries, top and topInTries when removing a zone', async () => {
    const boulder = {} as Boulder;

    const instance = {
      tries: 10,
      topInTries: 10,
      top: true,
      zone: true,
      zoneInTries: 5,
    } as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      zone: false,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(false);
    expect(res.tries).toEqual(10);
    expect(res.zone).toEqual(false);
    expect(res.zoneInTries).toEqual(0);
    expect(res.topInTries).toEqual(0);
  });

  it('gives a zone on a top', async () => {
    const boulder = {} as Boulder;

    const instance = {
      tries: 10,
      topInTries: 0,
      top: false,
      zone: false,
      zoneInTries: 0,
    } as BoulderingResult;

    const round = {
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    } as BoulderingRound;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const dto: CreateBoulderingResultDto = {
      top: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      round,
      boulder,
      user,
      dto,
    );

    expect(res).toBe(instance);
    expect(res.top).toEqual(true);
    expect(res.tries).toEqual(10);
    expect(res.zone).toEqual(true);
    expect(res.zoneInTries).toEqual(10);
    expect(res.topInTries).toEqual(10);
  });
});
