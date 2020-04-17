import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { CompetitionService } from '../../src/competition/competition.service';
import { NotFoundException } from '@nestjs/common';
import { Competition } from '../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { BoulderingRoundService } from '../../src/bouldering/bouldering-round.service';
import { CompetitionMapper } from '../../src/shared/mappers/competition.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';

const competitionRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
};

const competitionRegistrationRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const userServiceMock: ServiceMock = {
  register: jest.fn(),
  getOrFail: jest.fn(),
};

const boulderingRoundServiceMock: ServiceMock = {
  createRound: jest.fn(),
  addResult: jest.fn(),
};

describe('Competition service (unit)', () => {
  let competitionService: CompetitionService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CompetitionService,
        {
          provide: UserService,
          useFactory: () => userServiceMock,
        },
        {
          provide: BoulderingRoundService,
          useFactory: () => boulderingRoundServiceMock,
        },
        {
          provide: getRepositoryToken(Competition),
          useFactory: () => competitionRepositoryMock,
        },
        {
          provide: getRepositoryToken(CompetitionRegistration),
          useFactory: () => competitionRegistrationRepositoryMock,
        },
        {
          provide: CompetitionMapper,
          useClass: CompetitionMapper,
        },
      ],
    }).compile();

    competitionService = module.get(CompetitionService);
    utils = new TestUtils(undefined, competitionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws 404 when getting an unknown registration', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.getRegistrations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when deleting a registration on an unknown competition', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);
    userServiceMock.getOrFail.mockImplementation(async () => ({}));

    return expect(
      competitionService.removeRegistration(999999, 888888),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when deleting a registration on an unknown user', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => ({}));
    userServiceMock.getOrFail.mockImplementation(async () => undefined);

    return expect(
      competitionService.removeRegistration(888888, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when deleting an unknown registration', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => ({}));
    userServiceMock.getOrFail.mockImplementation(async () => ({}));
    competitionRegistrationRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    return expect(
      competitionService.removeRegistration(888888, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when adding a jury president to a unknown competition', async function () {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);
    userServiceMock.getOrFail.mockImplementation(async () => ({}));

    return expect(
      competitionService.addJuryPresident(999999, 888888),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when adding a bouldering round to a unknown competition', async function () {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.addBoulderingRound(
        999999,
        {} as CreateBoulderingRoundDto,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('calls bouldering round service to create a bouldering round', async function () {
    const competition = {};
    const newRound = {};
    const dto = {} as CreateBoulderingRoundDto;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.createRound.mockImplementation(
      async () => newRound,
    );

    const res = await competitionService.addBoulderingRound(999999, dto);

    expect(res).toBe(newRound);
    expect(boulderingRoundServiceMock.createRound).toHaveBeenCalledTimes(1);

    expect(boulderingRoundServiceMock.createRound).toHaveBeenCalledWith(
      competition,
      dto,
    );
  });

  it('returns when a competition exists with existsOrFail', async () => {
    competitionRepositoryMock.count.mockImplementation(async () => 1);
    const result = await competitionService.existsOrFail(1234);

    expect(result).toBeUndefined();
    expect(competitionRepositoryMock.count).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.count).toHaveBeenCalledWith({
      id: 1234,
    });
  });

  it('returns when a competition do not exists with existsOrFail', async () => {
    competitionRepositoryMock.count.mockImplementation(async () => undefined);

    return expect(competitionService.existsOrFail(1234)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('adds a bouldering result', async () => {
    const user = {};
    competitionRepositoryMock.count.mockImplementation(async () => 1);
    userServiceMock.getOrFail.mockImplementation(async () => user);

    const boulderingResult = {};
    boulderingRoundServiceMock.addResult.mockImplementation(
      async () => boulderingResult,
    );

    const dto = {
      climberId: utils.getRandomId(),
    } as CreateBoulderingResultDto;

    const result = await competitionService.addBoulderingResult(1, 2, 3, dto);

    expect(result).toBe(boulderingResult);
    expect(boulderingRoundServiceMock.addResult).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.addResult).toHaveBeenCalledWith(
      2,
      3,
      user,
      dto,
    );

    expect(userServiceMock.getOrFail).toHaveBeenCalledTimes(1);
    expect(userServiceMock.getOrFail).toHaveBeenCalledWith(dto.climberId);
    expect(competitionRepositoryMock.count).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.count).toHaveBeenCalledWith({
      id: 1,
    });
  });
});
