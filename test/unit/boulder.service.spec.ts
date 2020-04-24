import { BoulderService } from '../../src/bouldering/boulder/boulder.service';
import { RepositoryMock } from './mocks/types';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';

const boulderRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  findOne: jest.fn(),
  flush: jest.fn(),
};

describe('Boulder service (unit)', () => {
  let boulderService: BoulderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BoulderService,
        {
          provide: getRepositoryToken(Boulder),
          useFactory: () => boulderRepositoryMock,
        },
      ],
    }).compile();

    boulderService = module.get(BoulderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    const group = {} as BoulderingGroup;
    const boulders = await boulderService.createMany(group, 5);

    expect(boulders).toHaveLength(5);
    expect(boulderRepositoryMock.persistLater).toHaveBeenCalledTimes(5);

    for (const b of boulders) {
      expect(boulderRepositoryMock.persistLater).toHaveBeenCalledWith(b);
    }

    expect(boulderRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });
});
