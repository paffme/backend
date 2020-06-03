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
    const group = {} as BoulderingGroup;
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
    const group = {} as BoulderingGroup;
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
      try: true,
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
      try: true,
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
      try: true,
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
      try: true,
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
      try: true,
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
      try: true,
      climberId: 123,
    };

    return expect(
      boulderingResultService.addResult(group, boulder, user, dto),
    ).rejects.toBeInstanceOf(BoulderNotInGroupError);
  });
});
