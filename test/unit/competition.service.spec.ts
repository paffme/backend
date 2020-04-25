import TestUtils from '../utils';
import { UserService } from '../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { CompetitionService } from '../../src/competition/competition.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../src/shared/entity/competition-registration.entity';
import { BoulderingRoundService } from '../../src/bouldering/round/bouldering-round.service';
import { CompetitionMapper } from '../../src/shared/mappers/competition.mapper';
import { RepositoryMock, ServiceMock } from './mocks/types';
import { CreateBoulderingRoundDto } from '../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../src/competition/dto/in/body/create-bouldering-result.dto';
import { CompetitionType } from '../../src/competition/types/competition-type.enum';
import { BoulderingRankingService } from '../../src/bouldering/ranking/bouldering-ranking.service';
import { Category } from '../../src/shared/types/category.interface';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Sex } from '../../src/shared/types/sex.enum';
import { givenCategory } from '../fixture/category.fixture';

const competitionRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const competitionRegistrationRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  flush: jest.fn(),
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
  addClimbers: jest.fn(),
};

const boulderingRankingServiceMock: ServiceMock = {
  getRankings: jest.fn(),
};

const femaleMinime = givenCategory({
  sex: Sex.Female,
  name: CategoryName.Minime,
});

describe('Competition service (unit)', () => {
  let competitionService: CompetitionService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CompetitionService,
        {
          provide: UserService,
          useFactory: (): typeof userServiceMock => userServiceMock,
        },
        {
          provide: BoulderingRoundService,
          useFactory: (): typeof boulderingRoundServiceMock =>
            boulderingRoundServiceMock,
        },
        {
          provide: BoulderingRankingService,
          useFactory: (): typeof boulderingRankingServiceMock =>
            boulderingRankingServiceMock,
        },
        {
          provide: getRepositoryToken(Competition),
          useFactory: (): typeof competitionRepositoryMock =>
            competitionRepositoryMock,
        },
        {
          provide: getRepositoryToken(CompetitionRegistration),
          useFactory: (): typeof competitionRegistrationRepositoryMock =>
            competitionRegistrationRepositoryMock,
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

  it('adds a bouldering result', async () => {
    const user = {
      id: utils.getRandomId(),
      getCategory: (): Category => femaleMinime,
    };

    const boulderingResult = {};
    const boulderingRounds: unknown[] = [];
    const rankings = new Map();

    const competition = {
      type: CompetitionType.Bouldering,
      rankings: {},
      registrations: {
        getItems: jest.fn().mockImplementation(() => [{ climber: user }]),
      },
      boulderingRounds: {
        loadItems: jest.fn().mockImplementation(async () => boulderingRounds),
      },
      getSeason(): undefined {
        return undefined;
      },
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    userServiceMock.getOrFail.mockImplementation(async () => user);

    boulderingRoundServiceMock.addResult.mockImplementation(
      async () => boulderingResult,
    );

    boulderingRankingServiceMock.getRankings.mockImplementation(() => rankings);

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

    expect(boulderingRankingServiceMock.getRankings).toHaveBeenCalledTimes(1);
    expect(boulderingRankingServiceMock.getRankings).toHaveBeenCalledWith(
      boulderingRounds,
    );

    expect(userServiceMock.getOrFail).toHaveBeenCalledTimes(1);
    expect(userServiceMock.getOrFail).toHaveBeenCalledWith(dto.climberId);
    expect(competitionRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.findOne).toHaveBeenCalledWith(1, [
      'registrations',
    ]);
  });

  it('does not take a registration if the registrations are closed', () => {
    const competition = {
      takesRegistrations(): false {
        return false;
      },
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(competitionService.register(123, 456)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('adds the climber into the first round after being registered', async () => {
    const user = {
      getCategory: (): Category => femaleMinime,
    };

    const rounds = [
      {
        index: 1,
        category: CategoryName.Minime,
        sex: Sex.Female,
      },
      {
        index: 0,
        category: CategoryName.Minime,
        sex: Sex.Female,
        takesNewClimbers(): boolean {
          return true;
        },
      },
    ];

    const competition = {
      getSeason(): number {
        return 2020;
      },
      takesRegistrations(): true {
        return true;
      },
      boulderingRounds: {
        async loadItems(): Promise<unknown[]> {
          return rounds;
        },
      },
      type: CompetitionType.Bouldering,
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.addClimbers.mockImplementation(
      async () => undefined,
    );

    userServiceMock.getOrFail.mockImplementation(async () => user);

    await competitionService.register(123, 456);

    expect(boulderingRoundServiceMock.addClimbers).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.addClimbers).toHaveBeenCalledWith(
      rounds[1],
      user,
    );
  });

  it('does not add the climber into the first round after being registered if the round do not takes new climbers', async () => {
    const user = {
      getCategory: (): Category => femaleMinime,
    };

    const rounds = [
      {
        index: 0,
        category: CategoryName.Minime,
        sex: Sex.Female,
        takesNewClimbers(): boolean {
          return false;
        },
      },
    ];

    const competition = {
      getSeason(): number {
        return 2020;
      },
      takesRegistrations(): true {
        return true;
      },
      boulderingRounds: {
        async loadItems(): Promise<unknown[]> {
          return rounds;
        },
      },
      type: CompetitionType.Bouldering,
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.addClimbers.mockImplementation(
      async () => undefined,
    );

    userServiceMock.getOrFail.mockImplementation(async () => user);

    await competitionService.register(123, 456);

    expect(boulderingRoundServiceMock.addClimbers).toHaveBeenCalledTimes(0);
  });

  it('does not add a bouldering result if the climber if not registered', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => ({
      registrations: {
        getItems(): [] {
          return [];
        },
      },
    }));

    userServiceMock.getOrFail.mockImplementation(async () => ({}));

    return expect(
      competitionService.addBoulderingResult(
        1,
        2,
        3,
        {} as CreateBoulderingResultDto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
