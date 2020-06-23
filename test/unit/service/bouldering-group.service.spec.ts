import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import {
  BoulderingGroupRankingsUpdateEventPayload,
  BoulderingGroupService,
} from '../../../src/bouldering/group/bouldering-group.service';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { RepositoryMock, ServiceMock } from '../mocks/types';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../../../src/bouldering/round/bouldering-round.entity';
import { ConflictException } from '@nestjs/common';
import { BoulderService } from '../../../src/bouldering/boulder/boulder.service';
import { Boulder } from '../../../src/bouldering/boulder/boulder.entity';
import { BoulderNotFoundError } from '../../../src/bouldering/errors/boulder-not-found.error';
import { BoulderingGroupUnlimitedContestRankingService } from '../../../src/bouldering/group/ranking/bouldering-group-unlimited-contest-ranking.service';
import { BoulderingGroupCircuitRankingService } from '../../../src/bouldering/group/ranking/bouldering-group-circuit-ranking.service';
import { BoulderingGroupLimitedContestRankingService } from '../../../src/bouldering/group/ranking/bouldering-group-limited-contest-ranking.service';
import { BoulderingResultService } from '../../../src/bouldering/result/bouldering-result.service';
import { User } from '../../../src/user/user.entity';
import { CreateBoulderingResultDto } from '../../../src/competition/dto/in/body/create-bouldering-result.dto';
import pEvent from 'p-event';
import TestUtils from '../../utils';

const boulderingGroupRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  removeAndFlush: jest.fn(),
  count: jest.fn(),
};

const boulderServiceMock: ServiceMock = {
  assignJudge: jest.fn(),
  removeJudgeAssignment: jest.fn(),
};

const boulderingGroupUnlimitedContestRankingServiceMock: ServiceMock = {};
const boulderingGroupLimitedContestRankingServiceMock: ServiceMock = {};
const boulderingGroupCircuitRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const boulderingResultServiceMock: ServiceMock = {
  addResult: jest.fn(),
};

const boulderInitFn = jest.fn();

function givenBoulderingGroupWithBoulders(
  ...boulders: Boulder[]
): BoulderingGroup {
  boulderInitFn.mockImplementation(async () => {
    return {
      getItems(): Boulder[] {
        return boulders;
      },
    };
  });

  return ({
    boulders: {
      init: boulderInitFn,
    },
  } as unknown) as BoulderingGroup;
}

describe('Bouldering group service (unit)', () => {
  let boulderingGroupService: BoulderingGroupService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderingGroupService,
        {
          provide: getRepositoryToken(BoulderingGroup),
          useFactory: (): typeof boulderingGroupRepositoryMock =>
            boulderingGroupRepositoryMock,
        },
        {
          provide: BoulderingGroupUnlimitedContestRankingService,
          useValue: boulderingGroupUnlimitedContestRankingServiceMock,
        },
        {
          provide: BoulderingGroupLimitedContestRankingService,
          useValue: boulderingGroupLimitedContestRankingServiceMock,
        },
        {
          provide: BoulderingGroupCircuitRankingService,
          useValue: boulderingGroupCircuitRankingServiceMock,
        },
        {
          provide: BoulderingResultService,
          useValue: boulderingResultServiceMock,
        },
        {
          provide: BoulderService,
          useValue: boulderServiceMock,
        },
      ],
    }).compile();

    boulderingGroupService = module.get(BoulderingGroupService);
    utils = new TestUtils();
  });

  it('creates a group', async () => {
    const round = {} as BoulderingRound;
    boulderingGroupRepositoryMock.count.mockImplementation(async () => 0);
    boulderingGroupRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const result = await boulderingGroupService.create('0', round);
    expect(result).toBeInstanceOf(BoulderingGroup);
    expect(result.name).toEqual('0');
    expect(result.round).toBe(round);
    expect(result.climbers).toBeDefined();
    expect(result.boulders).toBeDefined();
    expect(result.results).toBeDefined();

    expect(boulderingGroupRepositoryMock.count).toHaveBeenCalledTimes(1);
    expect(boulderingGroupRepositoryMock.count).toHaveBeenCalledWith({
      name: '0',
      round,
    });

    expect(boulderingGroupRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );

    expect(boulderingGroupRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      result,
    );
  });

  it('does not create a group if the name is already used', () => {
    const round = {} as BoulderingRound;
    boulderingGroupRepositoryMock.count.mockImplementation(async () => 1);

    return expect(
      boulderingGroupService.create('0', round),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes a group', async () => {
    const group = {} as BoulderingGroup;
    boulderingGroupRepositoryMock.removeAndFlush.mockImplementation(
      async () => undefined,
    );

    const res = await boulderingGroupService.delete(group);

    expect(res).toBeUndefined();
    expect(boulderingGroupRepositoryMock.removeAndFlush).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingGroupRepositoryMock.removeAndFlush).toHaveBeenCalledWith(
      group,
    );
  });

  it('assigns a judge to a boulder', async () => {
    const boulder = {} as Boulder;

    const group = givenBoulderingGroupWithBoulders(boulder);

    boulderServiceMock.assignJudge.mockImplementation(async () => undefined);

    await boulderingGroupService.assignJudgeToBoulder(group, 1, 2);

    expect(boulderInitFn).toHaveBeenCalledTimes(1);
    expect(boulderInitFn).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(boulderServiceMock.assignJudge).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.assignJudge).toHaveBeenCalledWith(boulder, 2);
  });

  it('throws 404 when trying to assign a judge to a boulder on an non-existant boulder', () => {
    const group = givenBoulderingGroupWithBoulders();

    boulderServiceMock.assignJudge.mockImplementation(async () => undefined);

    return expect(
      boulderingGroupService.assignJudgeToBoulder(group, 1, 2),
    ).rejects.toBeInstanceOf(BoulderNotFoundError);
  });

  it('removes assignment of a judge to a boulder', async () => {
    const boulder = {} as Boulder;

    const group = givenBoulderingGroupWithBoulders(boulder);

    boulderServiceMock.removeJudgeAssignment.mockImplementation(
      async () => undefined,
    );

    await boulderingGroupService.removeJudgeAssignmentToBoulder(group, 1, 2);

    expect(boulderInitFn).toHaveBeenCalledTimes(1);
    expect(boulderInitFn).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(boulderServiceMock.removeJudgeAssignment).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.removeJudgeAssignment).toHaveBeenCalledWith(
      boulder,
      2,
    );
  });

  it('throws 404 when trying to remove assignment of a judge to a boulder on an non-existant boulder', () => {
    const group = givenBoulderingGroupWithBoulders();

    boulderServiceMock.removeJudgeAssignment.mockImplementation(
      async () => undefined,
    );

    return expect(
      boulderingGroupService.removeJudgeAssignmentToBoulder(group, 1, 2),
    ).rejects.toBeInstanceOf(BoulderNotFoundError);
  });

  it('gets boulders', async () => {
    const boulder = {} as Boulder;
    const group = givenBoulderingGroupWithBoulders(boulder);

    const boulders = await boulderingGroupService.getBoulders(group);

    expect(boulders).toHaveLength(1);
    expect(boulders[0]).toBe(boulder);
    expect(boulderInitFn).toHaveBeenCalledTimes(1);
    expect(boulderInitFn).toHaveBeenCalledWith(['judges']);
  });

  it('adds a result', async () => {
    const group = ({
      round: {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      },
      results: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async init() {},
      },
      rankings: {
        rankings: [],
      },
    } as unknown) as BoulderingGroup;
    const boulder = {} as Boulder;
    const climber = {} as User;
    const dto = {} as CreateBoulderingResultDto;
    const fakeResult = {};
    const fakeRankings = {
      rankings: [],
    };

    boulderingGroupCircuitRankingServiceMock.getRankings.mockImplementation(
      () => fakeRankings,
    );

    boulderingResultServiceMock.addResult.mockImplementation(
      async () => fakeResult,
    );

    const res = await boulderingGroupService.addResult(
      group,
      boulder,
      climber,
      dto,
    );

    expect(res).toBe(fakeResult);
    expect(boulderingResultServiceMock.addResult).toHaveBeenCalledTimes(1);
    expect(boulderingResultServiceMock.addResult).toHaveBeenCalledWith(
      group,
      boulder,
      climber,
      dto,
    );
    expect(
      boulderingGroupCircuitRankingServiceMock.getRankings,
    ).toHaveBeenCalledTimes(1);
    expect(
      boulderingGroupCircuitRankingServiceMock.getRankings,
    ).toHaveBeenCalledWith(group);
    expect(boulderingGroupRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingGroupRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      group,
    );
  });

  it('emits rankingsUpdate when adding a result', async () => {
    const group = ({
      id: utils.getRandomId(),
      round: {
        rankingType: BoulderingRoundRankingType.CIRCUIT,
      },
      results: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        async init() {},
      },
      rankings: {
        rankings: [],
      },
    } as unknown) as BoulderingGroup;
    const boulder = {} as Boulder;
    const climber = {} as User;
    const dto = {} as CreateBoulderingResultDto;
    const fakeResult = {};
    const fakeRankings = {
      rankings: [],
    };

    boulderingGroupCircuitRankingServiceMock.getRankings.mockImplementation(
      () => fakeRankings,
    );

    boulderingResultServiceMock.addResult.mockImplementation(
      async () => fakeResult,
    );

    const [res, eventPayload] = await Promise.all([
      boulderingGroupService.addResult(group, boulder, climber, dto),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      pEvent(boulderingGroupService, 'rankingsUpdate'),
    ]);

    const p = (eventPayload as unknown) as BoulderingGroupRankingsUpdateEventPayload;

    expect(res).toBe(fakeResult);
    expect(p.groupId).toEqual(group.id);
    expect(p.rankings).toBe(fakeRankings);
    expect(p).toHaveProperty('diff');
  });
});
