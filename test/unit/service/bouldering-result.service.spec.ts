import TestUtils from '../../utils';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingResultService } from '../../../src/bouldering/result/bouldering-result.service';
import { BoulderingResult } from '../../../src/bouldering/result/bouldering-result.entity';
import { RepositoryMock } from '../mocks/types';
import { BoulderingRoundRankingType } from '../../../src/bouldering/round/bouldering-round.entity';
import { Boulder } from '../../../src/bouldering/boulder/boulder.entity';
import { User } from '../../../src/user/user.entity';
import { CreateBoulderingResultDto } from '../../../src/competition/dto/in/body/create-bouldering-result.dto';
import { UnprocessableEntityException } from '@nestjs/common';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../../../src/bouldering/group/bouldering-group.entity';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';
import { ClimberNotInGroupError } from '../../../src/bouldering/errors/climber-not-in-group.error';
import { BoulderNotInGroupError } from '../../../src/bouldering/errors/boulder-not-in-group.error';
import { BulkBoulderingResultsDto } from '../../../src/competition/dto/in/body/bulk-bouldering-results.dto';

const boulderingResultRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  findOne: jest.fn(),
  flush: jest.fn(),
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
          useFactory: (): typeof boulderingResultRepositoryMock =>
            boulderingResultRepositoryMock,
        },
      ],
    }).compile();

    boulderingResultService = module.get(BoulderingResultService);
    utils = new TestUtils();
  });

  it('creates a new instance', () => {
    const group = {} as BoulderingGroup;
    const boulder = {} as Boulder;
    const user = {} as User;

    boulderingResultRepositoryMock.persistLater.mockImplementation(
      () => undefined,
    );

    const instance = boulderingResultService.createNewInstance(
      group,
      boulder,
      user,
    );

    expect(instance.climber).toBe(user);
    expect(instance.group).toBe(group);
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
    const group = ({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      climbers: { contains: () => true, async init() {} },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      boulders: { contains: () => true, async init() {} },
    } as unknown) as BoulderingGroup;

    const boulder = {} as Boulder;
    const user = {} as User;

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    boulderingResultRepositoryMock.persistLater.mockImplementation(
      () => undefined,
    );

    const instance = await boulderingResultService.getOrCreateNewInstance(
      group,
      boulder,
      user,
    );

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      group,
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
    const group = ({
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      climbers: { contains: () => true, async init() {} },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      boulders: { contains: () => true, async init() {} },
    } as unknown) as BoulderingGroup;

    const boulder = {} as Boulder;
    const user = {} as User;

    const instance = {} as BoulderingResult;

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.getOrCreateNewInstance(
      group,
      boulder,
      user,
    );

    expect(res).toBe(instance);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);

    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber: user,
      group,
      boulder,
    });

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      0,
    );
  });

  it('adds a result for a unlimited contest', async () => {
    const boulder = {} as Boulder;
    const instance = {} as BoulderingResult;

    const user = {
      id: utils.getRandomId(),
    } as User;

    const round = givenBoulderingRound(
      {
        rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
      },
      undefined,
      undefined,
      [user],
    );

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      top: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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
      group,
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

    const user = {
      id: utils.getRandomId(),
    } as User;

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
    });

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      try: 1,
      top: true,
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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
      group,
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

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      try: 1,
      top: true,
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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
      group,
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

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      try: 1,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when adding a zone to a non counted zones round', () => {
    const boulder = {} as Boulder;
    const instance = {} as BoulderingResult;

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      zone: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
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

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      top: false,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      zone: false,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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

    const round = givenBoulderingRound({
      rankingType: BoulderingRoundRankingType.CIRCUIT,
    });

    const user = {
      id: utils.getRandomId(),
    } as User;

    const group = givenBoulderingGroup(
      {
        round,
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: CreateBoulderingResultDto = {
      top: true,
      climberId: user.id,
    };

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const res = await boulderingResultService.addResult(
      group,
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

  it('should not add a result if maxTries is already reached for a limited contest', () => {
    const boulder = {} as Boulder;
    const user = {} as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          maxTries: 5,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    boulderingResultRepositoryMock.findOne.mockImplementation(async () => ({
      tries: 5,
    }));

    const dto: CreateBoulderingResultDto = {
      try: 1,
      climberId: 123,
    };

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws ClimberNotInGroupError', () => {
    const boulder = {} as Boulder;
    const user = {} as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound(),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [],
    );

    boulderingResultRepositoryMock.findOne.mockImplementation(async () => ({}));

    const dto: CreateBoulderingResultDto = {
      try: 1,
      climberId: 123,
    };

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
    ).rejects.toBeInstanceOf(ClimberNotInGroupError);
  });

  it('throws BoulderNotInGroupError', () => {
    const boulder = {} as Boulder;
    const user = {} as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound(),
        state: BoulderingGroupState.ONGOING,
      },
      [],
      [user],
    );

    boulderingResultRepositoryMock.findOne.mockImplementation(async () => ({}));

    const dto: CreateBoulderingResultDto = {
      try: 1,
      climberId: 123,
    };

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
    ).rejects.toBeInstanceOf(BoulderNotInGroupError);
  });

  it('creates the result if it does not exists when adding bulk results', async () => {
    const boulder = {
      id: 0,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      2,
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        boulder,
        climber: user,
      }),
    );

    expect(boulderingResultRepositoryMock.persistLater.mock.calls[0][0]).toBe(
      boulderingResultRepositoryMock.persistLater.mock.calls[1][0],
    );
  });

  it('use an already existing result when adding bulk results', async () => {
    const boulder = {
      id: 0,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const instance = {} as BoulderingResult;

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => instance,
    );

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      1,
    );

    expect(boulderingResultRepositoryMock.persistLater.mock.calls[0][0]).toBe(
      instance,
    );
  });

  it('handles bulk results for a group for a circuit', async () => {
    const boulder1 = {
      id: 0,
    } as Boulder;

    const boulder2 = {
      id: 1,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder1, boulder2],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
        {
          climberId: 0,
          boulderId: 1,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      4, // 2 by the result creation, 2 at the end to save, they all points to the same objects so we only test the first two calls
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder1,
        climber: user,
        zone: true,
        top: true,
        zoneInTries: 1,
        topInTries: 1,
        tries: 1,
      }),
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[1][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder2,
        climber: user,
        zone: true,
        top: true,
        zoneInTries: 1,
        topInTries: 1,
        tries: 1,
      }),
    );

    expect(boulderingResultRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('handles bulk results for a group for a limited contest', async () => {
    const boulder1 = {
      id: 0,
    } as Boulder;

    const boulder2 = {
      id: 1,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.LIMITED_CONTEST,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder1, boulder2],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.LIMITED_CONTEST,
        },
        {
          climberId: 0,
          boulderId: 1,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.LIMITED_CONTEST,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      4, // 2 by the result creation, 2 at the end to save, they all points to the same objects so we only test the first two calls
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder1,
        climber: user,
        zone: true,
        top: true,
        zoneInTries: 1,
        topInTries: 1,
        tries: 1,
      }),
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[1][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder2,
        climber: user,
        zone: true,
        top: true,
        zoneInTries: 1,
        topInTries: 1,
        tries: 1,
      }),
    );

    expect(boulderingResultRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('handles bulk results for a group for an unlimited contest', async () => {
    const boulder1 = {
      id: 0,
    } as Boulder;

    const boulder2 = {
      id: 1,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder1, boulder2],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          top: true,
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        },
        {
          climberId: 0,
          boulderId: 1,
          top: true,
          type: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      4, // 2 by the result creation, 2 at the end to save, they all points to the same objects so we only test the first two calls
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder1,
        climber: user,
        zone: false,
        top: true,
        zoneInTries: 0,
        topInTries: 0,
        tries: 0,
      }),
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[1][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder2,
        climber: user,
        zone: false,
        top: true,
        zoneInTries: 0,
        topInTries: 0,
        tries: 0,
      }),
    );

    expect(boulderingResultRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('does not change results if not needed when adding bulk results for a circuit', async () => {
    const boulder1 = {
      id: 0,
    } as Boulder;

    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder1],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          climberId: 0,
          boulderId: 0,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    boulderingResultRepositoryMock.flush.mockImplementation(
      async () => undefined,
    );

    await boulderingResultService.bulkResults(group, dto);

    expect(boulderingResultRepositoryMock.persistLater).toHaveBeenCalledTimes(
      2, // 1 by the result creation, 1 at the end to save, they all points to the same objects so we only test the first call
    );

    expect(
      boulderingResultRepositoryMock.persistLater.mock.calls[0][0],
    ).toEqual(
      expect.objectContaining({
        boulder: boulder1,
        climber: user,
        zone: false,
        top: false,
        zoneInTries: 0,
        topInTries: 0,
        tries: 0,
      }),
    );

    expect(boulderingResultRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('throws BoulderNotInGroupError when adding bulk results with an unknown boulder', () => {
    const user = {
      id: 0,
    } as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound(),
        state: BoulderingGroupState.ONGOING,
      },
      [],
      [user],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          boulderId: 0,
          climberId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    return expect(
      boulderingResultService.bulkResults(group, dto),
    ).rejects.toBeInstanceOf(BoulderNotInGroupError);
  });

  it('throws ClimberNotInGroupError when adding bulk results with an unknown climber', () => {
    const boulder = {
      id: 0,
    } as Boulder;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound(),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [],
    );

    const dto: BulkBoulderingResultsDto = {
      results: [
        {
          boulderId: 0,
          climberId: 0,
          topInTries: 1,
          zoneInTries: 1,
          type: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    };

    return expect(
      boulderingResultService.bulkResults(group, dto),
    ).rejects.toBeInstanceOf(ClimberNotInGroupError);
  });

  it('gets a bouldering result', async () => {
    const boulder = {} as Boulder;
    const climber = {} as User;
    const fakeResult = {};

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [climber],
    );

    boulderingResultRepositoryMock.findOne.mockImplementation(
      async () => fakeResult,
    );

    const res = await boulderingResultService.getOrFail(
      group,
      boulder,
      climber,
    );

    expect(res).toBe(fakeResult);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderingResultRepositoryMock.findOne).toHaveBeenCalledWith({
      climber,
      boulder,
      group,
    });
  });

  it('throws climber not in group when getting a bouldering result', () => {
    const boulder = {} as Boulder;
    const climber = {} as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [boulder],
      [],
    );

    return expect(
      boulderingResultService.getOrFail(group, boulder, climber),
    ).rejects.toBeInstanceOf(ClimberNotInGroupError);
  });

  it('throws boulder not in group when getting a bouldering result', () => {
    const boulder = {} as Boulder;
    const climber = {} as User;

    const group = givenBoulderingGroup(
      {
        round: givenBoulderingRound({
          rankingType: BoulderingRoundRankingType.CIRCUIT,
        }),
        state: BoulderingGroupState.ONGOING,
      },
      [],
      [climber],
    );

    return expect(
      boulderingResultService.getOrFail(group, boulder, climber),
    ).rejects.toBeInstanceOf(BoulderNotInGroupError);
  });
});
