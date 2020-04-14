import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { CompetitionService } from '../../src/competition/competition.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { BoulderingService } from '../../src/bouldering/bouldering.service';
import { CompetitionMapper } from '../../src/shared/mappers/competition.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';

const competitionRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
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

const boulderingServiceMock: ServiceMock = {};

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
          provide: BoulderingService,
          useFactory: () => boulderingServiceMock,
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

  it('returns 404 when getting an unknown registration', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.getRegistrations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting a registration on an unknown competition', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);
    userServiceMock.getOrFail.mockImplementation(async () => ({}));

    return expect(
      competitionService.removeRegistration(999999, 888888),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting a registration on an unknown user', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => ({}));
    userServiceMock.getOrFail.mockImplementation(async () => undefined);

    return expect(
      competitionService.removeRegistration(888888, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when deleting an unknown registration', async () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => ({}));
    userServiceMock.getOrFail.mockImplementation(async () => ({}));
    competitionRegistrationRepositoryMock.findOne.mockImplementation(
      async () => undefined,
    );

    return expect(
      competitionService.removeRegistration(888888, 999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when adding a jury president to a unknown competition', async function () {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);
    userServiceMock.getOrFail.mockImplementation(async () => ({}));

    return expect(
      competitionService.addJuryPresident(999999, 888888),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
