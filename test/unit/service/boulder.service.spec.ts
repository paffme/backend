import { BoulderService } from '../../../src/bouldering/boulder/boulder.service';
import { RepositoryMock } from '../mocks/types';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { Boulder } from '../../../src/bouldering/boulder/boulder.entity';
import { Test } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { givenBoulderingGroup } from '../../fixture/bouldering-group.fixture';
import { CreateBoulderDto } from '../../../src/competition/dto/in/body/create-boulder.dto';
import { Collection, InitOptions } from 'mikro-orm';
import TestUtils from '../../utils';

const boulderRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  removeAndFlush: jest.fn(),
  persistLater: jest.fn(),
  findOne: jest.fn(),
  flush: jest.fn(),
};

describe('Boulder service (unit)', () => {
  let boulderService: BoulderService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderService,
        {
          provide: getRepositoryToken(Boulder),
          useFactory: (): typeof boulderRepositoryMock => boulderRepositoryMock,
        },
      ],
    }).compile();

    boulderService = module.get(BoulderService);
    utils = new TestUtils();
  });

  it('gets a boulder', async () => {
    const boulder = {};
    boulderRepositoryMock.findOne.mockImplementation(async () => boulder);

    const res = await boulderService.getOrFail(123);

    expect(res).toBe(boulder);
    expect(boulderRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.findOne).toHaveBeenCalledWith(123);
  });

  it('throws not found when boulder do not exists', () => {
    boulderRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(boulderService.getOrFail(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates many boulder at once', async () => {
    boulderRepositoryMock.persistLater.mockImplementation(() => undefined);
    boulderRepositoryMock.flush.mockImplementation(async () => undefined);

    const group = {
      boulders: {
        count() {
          return 0;
        },
      },
    } as BoulderingGroup;
    const boulders = await boulderService.createMany(group, 5);

    expect(boulders).toHaveLength(5);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(5);

    for (const b of boulders) {
      expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(b);
    }

    expect(boulderRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('prevents creating multiple boulder at once if there already multiples existing', () => {
    const group = {
      boulders: {
        count() {
          return 1;
        },
      },
    } as BoulderingGroup;

    return expect(boulderService.createMany(group, 5)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('creates a boulder without an index in the dto and put the boulder at the end', async () => {
    const boulders: Boulder[] = [];
    const group = givenBoulderingGroup(undefined, {
      async loadItems(): Promise<Boulder[]> {
        return boulders;
      },
    });

    const dto: CreateBoulderDto = {};
    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const result = await boulderService.create(group, dto);

    expect(result).toBeInstanceOf(Boulder);
    expect(result.index).toEqual(0);
    expect(result.group).toBe(group);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(boulders);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(result);
  });

  it('creates a boulder with an index in the dto and shift other boulders', async () => {
    const boulders: Partial<Boulder>[] = [
      {
        index: 0,
      },
      {
        index: 1,
      },
    ];

    const group = givenBoulderingGroup(undefined, {
      async loadItems(): Promise<Boulder[]> {
        return boulders as Boulder[];
      },
    });

    const dto: CreateBoulderDto = {
      index: 1,
    };

    boulderRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const result = await boulderService.create(group, dto);

    expect(result).toBeInstanceOf(Boulder);
    expect(result.index).toEqual(1);
    expect(result.group).toBe(group);
    expect(boulders[0].index).toEqual(0);
    expect(boulders[1].index).toEqual(2);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(boulders);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.persistAndFlush).toHaveBeenCalledWith(result);
  });

  it('throws when adding a boulder at an invalid index', () => {
    const group = givenBoulderingGroup(undefined, {
      async loadItems(): Promise<Boulder[]> {
        return [
          {
            index: 0,
          },
        ] as Boulder[];
      },
    });

    const dto: CreateBoulderDto = {
      index: 2,
    };

    return expect(boulderService.create(group, dto)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('removes a boulder', async () => {
    const boulders: Partial<Boulder>[] = [
      {
        id: utils.getRandomId(),
        index: 0,
      },
    ];

    boulderRepositoryMock.removeAndFlush.mockImplementation(
      async () => undefined,
    );

    const group = givenBoulderingGroup(undefined, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      async init(
        options: InitOptions<Boulder>,
      ): Promise<Partial<Collection<Boulder>>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        expect(options.where.id).toEqual(boulders[0].id);

        return {
          getItems(): Boulder[] {
            return boulders as Boulder[];
          },
        };
      },
    });

    await boulderService.remove(group, boulders[0].id!);

    expect(boulderRepositoryMock.removeAndFlush).toHaveBeenCalledTimes(1);
    expect(boulderRepositoryMock.removeAndFlush).toHaveBeenCalledWith(
      boulders[0],
    );
  });

  it('throws not found when trying to delete an unknown boulder', () => {
    const group = givenBoulderingGroup(undefined, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      async init(): Promise<Partial<Collection<Boulder>>> {
        return {
          getItems(): Boulder[] {
            return [];
          },
        };
      },
    });

    return expect(boulderService.remove(group, 123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
