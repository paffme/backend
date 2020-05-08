import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { BoulderingGroupService } from '../../../src/bouldering/group/bouldering-group.service';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { RepositoryMock } from '../mocks/types';
import { BoulderingRound } from '../../../src/bouldering/round/bouldering-round.entity';
import { ConflictException } from '@nestjs/common';

const boulderingGroupRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  removeAndFlush: jest.fn(),
  count: jest.fn(),
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
});
