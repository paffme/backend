import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingGroupService } from '../../../src/bouldering/group/bouldering-group.service';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { RepositoryMock, ServiceMock } from '../mocks/types';
import { BoulderingRound } from '../../../src/bouldering/round/bouldering-round.entity';
import { ConflictException } from '@nestjs/common';
import { BoulderService } from '../../../src/bouldering/boulder/boulder.service';
import { Boulder } from '../../../src/bouldering/boulder/boulder.entity';
import { BoulderNotFoundError } from '../../../src/bouldering/errors/boulder-not-found.error';

const boulderingGroupRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  removeAndFlush: jest.fn(),
  count: jest.fn(),
};

const boulderServiceMock: ServiceMock = {
  assignJudge: jest.fn(),
  removeJudgeAssignment: jest.fn(),
};

describe('Bouldering group service (unit)', () => {
  let boulderingGroupService: BoulderingGroupService;

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
          provide: BoulderService,
          useValue: boulderServiceMock,
        },
      ],
    }).compile();

    boulderingGroupService = module.get(BoulderingGroupService);
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

    const group = ({
      boulders: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        async init(opts) {
          expect(opts.where?.id).toEqual(1);

          return {
            getItems(): Boulder[] {
              return [boulder];
            },
          };
        },
      },
    } as unknown) as BoulderingGroup;

    boulderServiceMock.assignJudge.mockImplementation(async () => undefined);

    await boulderingGroupService.assignJudgeToBoulder(group, 1, 2);

    expect(boulderServiceMock.assignJudge).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.assignJudge).toHaveBeenCalledWith(boulder, 2);
  });

  it('throws 404 when trying to assign a judge to a boulder on an non-existant boulder', () => {
    const group = ({
      boulders: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        async init(opts) {
          expect(opts.where?.id).toEqual(1);

          return {
            getItems(): Boulder[] {
              return [];
            },
          };
        },
      },
    } as unknown) as BoulderingGroup;

    boulderServiceMock.assignJudge.mockImplementation(async () => undefined);

    return expect(
      boulderingGroupService.assignJudgeToBoulder(group, 1, 2),
    ).rejects.toBeInstanceOf(BoulderNotFoundError);
  });

  it('removes assignment of a judge to a boulder', async () => {
    const boulder = {} as Boulder;

    const group = ({
      boulders: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,sonarjs/no-identical-functions
        async init(opts) {
          expect(opts.where?.id).toEqual(1);

          return {
            getItems(): Boulder[] {
              return [boulder];
            },
          };
        },
      },
    } as unknown) as BoulderingGroup;

    boulderServiceMock.removeJudgeAssignment.mockImplementation(
      async () => undefined,
    );

    await boulderingGroupService.removeJudgeAssignmentToBoulder(group, 1, 2);

    expect(boulderServiceMock.removeJudgeAssignment).toHaveBeenCalledTimes(1);
    expect(boulderServiceMock.removeJudgeAssignment).toHaveBeenCalledWith(
      boulder,
      2,
    );
  });

  it('throws 404 when trying to remove assignment of a judge to a boulder on an non-existant boulder', () => {
    const group = ({
      boulders: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,sonarjs/no-identical-functions
        async init(opts) {
          expect(opts.where?.id).toEqual(1);

          return {
            getItems(): Boulder[] {
              return [];
            },
          };
        },
      },
    } as unknown) as BoulderingGroup;

    boulderServiceMock.removeJudgeAssignment.mockImplementation(
      async () => undefined,
    );

    return expect(
      boulderingGroupService.removeJudgeAssignmentToBoulder(group, 1, 2),
    ).rejects.toBeInstanceOf(BoulderNotFoundError);
  });
});
