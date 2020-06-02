import TestUtils from '../../utils';
import { UserService } from '../../../src/user/user.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { CompetitionService } from '../../../src/competition/competition.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Competition } from '../../../src/competition/competition.entity';
import { CompetitionRegistration } from '../../../src/shared/entity/competition-registration.entity';
import { BoulderingRoundService } from '../../../src/bouldering/round/bouldering-round.service';
import { CompetitionMapper } from '../../../src/shared/mappers/competition.mapper';
import { RepositoryMock, ServiceMock } from '../mocks/types';
import { CreateBoulderingRoundDto } from '../../../src/competition/dto/in/body/create-bouldering-round.dto';
import { CreateBoulderingResultDto } from '../../../src/competition/dto/in/body/create-bouldering-result.dto';
import { CompetitionType } from '../../../src/competition/types/competition-type.enum';
import { BoulderingRankingService } from '../../../src/bouldering/ranking/bouldering-ranking.service';
import { Category } from '../../../src/shared/types/category.interface';
import { CategoryName } from '../../../src/shared/types/category-name.enum';
import { Sex } from '../../../src/shared/types/sex.enum';
import { givenCategory } from '../../fixture/category.fixture';
import { UpdateCompetitionByIdDto } from '../../../src/competition/dto/in/body/update-competition-by-id.dto';
import { Collection, QueryOrder } from 'mikro-orm';
import { CreateBoulderDto } from '../../../src/competition/dto/in/body/create-boulder.dto';
import { BoulderingRound } from '../../../src/bouldering/round/bouldering-round.entity';
import { givenBoulderingRound } from '../../fixture/bouldering-round.fixture';
import { InitOptions } from 'mikro-orm/dist/entity/Collection';
import { BoulderingGroup } from '../../../src/bouldering/group/bouldering-group.entity';
import { CreateBoulderingGroupDto } from '../../../src/competition/dto/in/body/create-bouldering-group.dto';
import { SearchQuery } from '../../../src/shared/decorators/search.decorator';
import { givenCompetition } from '../../fixture/competition.fixture';
import { CompetitionRoundType } from '../../../src/competition/competition-round-type.enum';
import { AlreadyRegisteredError } from '../../../src/competition/errors/already-registered.error';
import { CompetitionNotFoundError } from '../../../src/competition/errors/competition-not-found.error';
import { RoundNotFoundError } from '../../../src/bouldering/errors/round-not-found.error';
import { Boulder } from '../../../src/bouldering/boulder/boulder.entity';

const competitionRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  flush: jest.fn(),
};

const competitionRegistrationRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  persistLater: jest.fn(),
  flush: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn().mockImplementation(async () => 0),
};

const userServiceMock: ServiceMock = {
  register: jest.fn(),
  getOrFail: jest.fn(),
};

const boulderingRoundServiceMock: ServiceMock = {
  createRound: jest.fn(),
  addResult: jest.fn(),
  addClimbers: jest.fn(),
  createBoulder: jest.fn(),
  removeBoulder: jest.fn(),
  createGroup: jest.fn(),
  deleteGroup: jest.fn(),
  delete: jest.fn(),
  assignJudgeToBoulder: jest.fn(),
  removeJudgeAssignmentToBoulder: jest.fn(),
  getGroupBoulders: jest.fn(),
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

  it('gets competitions with filtering, ordering and pagination', async () => {
    const now = new Date();
    const data: unknown[] = [];

    competitionRepositoryMock.findAndCount.mockImplementation(async () => [
      data,
      0,
    ]);

    const res = await competitionService.getCompetitions(
      {
        offset: 10,
        limit: 11,
      },
      {
        order: {
          startDate: QueryOrder.desc,
        },
        filter: {
          startDate: {
            $gte: now,
          },
        },
      },
    );

    expect(competitionRepositoryMock.findAndCount).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.findAndCount).toHaveBeenCalledWith(
      {
        startDate: {
          $gte: now,
        },
      },
      {
        limit: 11,
        offset: 10,
        orderBy: {
          startDate: QueryOrder.desc,
        },
      },
    );

    expect(res.total).toEqual(0);
    expect(res.data).toBe(data);
  });

  it('throws 404 when getting an unknown registration', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.getRegistrations(
        {
          limit: 1,
          offset: 1,
        },
        999999,
      ),
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

    const result = await competitionService.addBoulderingResult(
      1,
      2,
      3,
      4,
      dto,
    );

    expect(result).toBe(boulderingResult);
    expect(boulderingRoundServiceMock.addResult).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.addResult).toHaveBeenCalledWith(
      2,
      3,
      4,
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
        type: CompetitionRoundType.FINAL,
        category: CategoryName.Minime,
        sex: Sex.Female,
      },
      {
        type: CompetitionRoundType.QUALIFIER,
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
      getQualifierRound(): BoulderingRound {
        return rounds[1] as BoulderingRound;
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
        type: CompetitionRoundType.QUALIFIER,
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
      getQualifierRound(): BoulderingRound {
        return rounds[0] as BoulderingRound;
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

  it('throws when adding an already registered climber', async () => {
    const user = {
      getCategory: (): Category => femaleMinime,
    };

    const rounds = [
      {
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

    competitionRegistrationRepositoryMock.count.mockImplementation(
      async () => 1,
    );

    userServiceMock.getOrFail.mockImplementation(async () => user);

    return expect(competitionService.register(123, 456)).rejects.toBeInstanceOf(
      AlreadyRegisteredError,
    );
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
        4,
        {} as CreateBoulderingResultDto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates a competition by id', async () => {
    const competition = {
      city: 'old city',
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    competitionRepositoryMock.persistAndFlush.mockImplementation(
      async () => undefined,
    );

    const dto: UpdateCompetitionByIdDto = {
      city: 'new city',
    };

    const result = await competitionService.updateById(123, dto);

    expect(result.city).toEqual(dto.city);
    expect(competition.city).toEqual(dto.city);
    expect(competitionRepositoryMock.persistAndFlush).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.persistAndFlush).toHaveBeenCalledWith(
      competition,
    );
  });

  it('throws 404 when updating an unknown competition', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.updateById(123, {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  function givenCompetitionWithBoulderingRound(): {
    round: BoulderingRound;
    competition: {
      id: typeof Competition.prototype.id;
      boulderingRounds: Partial<Collection<BoulderingRound>>;
    };
  } {
    const round = givenBoulderingRound();

    const competition = {
      id: utils.getRandomId(),
      boulderingRounds: {
        async init(
          options: InitOptions<BoulderingGroup>,
        ): Promise<Partial<Collection<BoulderingRound>>> {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          expect(options.where.id).toEqual(round.id);

          return {
            getItems(): BoulderingRound[] {
              return [round];
            },
          };
        },
      },
    };

    return {
      round,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      competition,
    };
  }

  function givenCompetitionWithNoBoulderingRounds(): Partial<{
    boulderingRounds: Partial<Collection<BoulderingRound>>;
  }> {
    return {
      boulderingRounds: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        async init(): Promise<Partial<Collection<BoulderingRound>>> {
          return {
            getItems(): BoulderingRound[] {
              return [];
            },
          };
        },
      },
    };
  }

  it('adds a boulder', async () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();
    const dto: CreateBoulderDto = {};
    const fakeBoulder = {};

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.createBoulder.mockImplementation(
      async () => fakeBoulder,
    );

    const result = await competitionService.createBoulder(
      competition.id,
      round.id,
      3,
      dto,
    );

    expect(result).toBe(fakeBoulder);
    expect(boulderingRoundServiceMock.createBoulder).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.createBoulder).toHaveBeenCalledWith(
      round,
      3,
      dto,
    );
  });

  it('throws not found when adding a boulder to an unknown round', () => {
    const competition = givenCompetitionWithNoBoulderingRounds();
    const dto: CreateBoulderDto = {};

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.createBoulder(1, 2, 3, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a boulder', async () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.removeBoulder.mockImplementation(
      async () => undefined,
    );

    await competitionService.deleteBoulder(competition.id, round.id, 3, 4);

    expect(boulderingRoundServiceMock.removeBoulder).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.removeBoulder).toHaveBeenCalledWith(
      round,
      3,
      4,
    );
  });

  it('throws not found when removing a boulder to an unknown round', () => {
    const competition = givenCompetitionWithNoBoulderingRounds();
    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.deleteBoulder(1, 2, 3, 4),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds a bouldering group', async () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();
    const dto: CreateBoulderingGroupDto = {
      name: 'supername',
    };
    const fakeGroup = {};

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.createGroup.mockImplementation(
      async () => fakeGroup,
    );

    const result = await competitionService.createBoulderingGroup(
      competition.id,
      round.id,
      dto,
    );

    expect(result).toBe(fakeGroup);
    expect(boulderingRoundServiceMock.createGroup).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.createGroup).toHaveBeenCalledWith(
      round,
      dto,
    );
  });

  it('throws not found when adding a bouldering group to an unknown round', () => {
    const competition = givenCompetitionWithNoBoulderingRounds();
    const dto: CreateBoulderingGroupDto = {
      name: 'name',
    };

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.createBoulderingGroup(1, 2, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found adding a bouldering group to an unknown competition', () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);
    const dto: CreateBoulderingGroupDto = {
      name: 'name',
    };

    return expect(
      competitionService.createBoulderingGroup(competition.id, round.id, dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a bouldering group', async () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.deleteGroup.mockImplementation(
      async () => undefined,
    );

    const result = await competitionService.deleteBoulderingGroup(
      competition.id,
      round.id,
      3,
    );

    expect(result).toBeUndefined();
    expect(boulderingRoundServiceMock.deleteGroup).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.deleteGroup).toHaveBeenCalledWith(
      round,
      3,
    );
  });

  it('throws not found when removing a bouldering group to an unknown round', () => {
    const competition = givenCompetitionWithNoBoulderingRounds();

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.deleteBoulderingGroup(1, 2, 3),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when removing a bouldering group to an unknown competition', () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.deleteBoulderingGroup(competition.id, round.id, 3),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes a bouldering round', async () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.delete.mockImplementation(async () => undefined);

    const result = await competitionService.deleteBoulderingRound(
      competition.id,
      round.id,
    );

    expect(result).toBeUndefined();
    expect(boulderingRoundServiceMock.delete).toHaveBeenCalledTimes(1);
    expect(boulderingRoundServiceMock.delete).toHaveBeenCalledWith(round);
  });

  it('throws not found when removing a unknown bouldering round', () => {
    const competition = givenCompetitionWithNoBoulderingRounds();

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.deleteBoulderingRound(1, 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when removing a bouldering round to an unknown competition', () => {
    const { competition, round } = givenCompetitionWithBoulderingRound();
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.deleteBoulderingRound(competition.id, round.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('counts', async () => {
    const search = {
      filter: {},
    } as SearchQuery<Competition>;
    competitionRepositoryMock.count.mockImplementation(async () => 10);

    const count = await competitionService.count(search);

    expect(count).toEqual(10);
    expect(competitionRepositoryMock.count).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.count).toHaveBeenCalledWith(search.filter);
  });

  it('starts qualifiers', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
        category: CategoryName.Senior,
        sex: Sex.Male,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.SEMI_FINAL,
        category: CategoryName.Senior,
        sex: Sex.Male,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.FINAL,
        category: CategoryName.Senior,
        sex: Sex.Male,
      }),
    ];

    competition.boulderingRounds = {
      getItems(): typeof competitionRounds {
        return competitionRounds;
      },
    } as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    competitionRepositoryMock.persistLater.mockImplementation(() => undefined);
    competitionRepositoryMock.flush.mockImplementation(async () => undefined);

    const rounds = await competitionService.startQualifiers(1);

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toBe(competitionRounds[0]);
    expect(competitionRepositoryMock.persistLater).toHaveBeenCalledTimes(1);
    expect(competitionRepositoryMock.persistLater).toHaveBeenCalledWith(
      competitionRounds[0],
    );
    expect(competitionRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('starts semi finals', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
        category: CategoryName.Senior,
        sex: Sex.Male,
        rankings: {
          groups: [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            {
              id: 0,
              rankings: [],
            },
          ],
        },
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.SEMI_FINAL,
        category: CategoryName.Senior,
        sex: Sex.Male,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.FINAL,
        category: CategoryName.Senior,
        sex: Sex.Male,
      }),
    ];

    competition.boulderingRounds = {
      getItems(): typeof competitionRounds {
        return competitionRounds;
      },
    } as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    competitionRepositoryMock.persistLater.mockImplementation(() => undefined);
    competitionRepositoryMock.flush.mockImplementation(async () => undefined);

    const rounds = await competitionService.startSemiFinals(1);

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toBe(competitionRounds[1]);
    expect(competitionRepositoryMock.persistLater).toHaveBeenCalledTimes(2);

    expect(competitionRepositoryMock.persistLater).toHaveBeenNthCalledWith(
      1,
      competitionRounds[0],
    );

    expect(competitionRepositoryMock.persistLater).toHaveBeenNthCalledWith(
      2,
      competitionRounds[1],
    );

    expect(competitionRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('starts finals', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
        sex: Sex.Male,
        category: CategoryName.Senior,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.SEMI_FINAL,
        sex: Sex.Male,
        category: CategoryName.Senior,
        rankings: {
          groups: [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              id: 0,
              rankings: [],
            },
          ],
        },
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.FINAL,
        sex: Sex.Male,
        category: CategoryName.Senior,
      }),
    ];

    competition.boulderingRounds = {
      getItems(): typeof competitionRounds {
        return competitionRounds;
      },
    } as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    competitionRepositoryMock.persistLater.mockImplementation(() => undefined);
    competitionRepositoryMock.flush.mockImplementation(async () => undefined);

    const rounds = await competitionService.startFinals(1);

    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toBe(competitionRounds[2]);
    expect(competitionRepositoryMock.persistLater).toHaveBeenCalledTimes(2);

    expect(competitionRepositoryMock.persistLater).toHaveBeenNthCalledWith(
      1,
      competitionRounds[1],
    );

    expect(competitionRepositoryMock.persistLater).toHaveBeenNthCalledWith(
      2,
      competitionRounds[2],
    );

    expect(competitionRepositoryMock.flush).toHaveBeenCalledTimes(1);
  });

  it('gets bouldering rounds by category by type', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
        category: CategoryName.Poussin,
        sex: Sex.Female,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.SEMI_FINAL,
        category: CategoryName.Poussin,
        sex: Sex.Female,
      }),
      givenBoulderingRound({
        type: CompetitionRoundType.FINAL,
        category: CategoryName.Poussin,
        sex: Sex.Male,
      }),
    ];

    competition.boulderingRounds = {
      getItems(): typeof competitionRounds {
        return competitionRounds;
      },
    } as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    const result = await competitionService.getBoulderingRoundsByCategoryByType(
      competition.id,
    );

    expect(result).toHaveProperty(CategoryName.Poussin);
    expect(result[CategoryName.Poussin]).toHaveProperty(Sex.Male);
    expect(result[CategoryName.Poussin]).toHaveProperty(Sex.Female);

    expect(result[CategoryName.Poussin]![Sex.Male]).toHaveProperty(
      CompetitionRoundType.FINAL,
    );

    expect(
      result[CategoryName.Poussin]![Sex.Male]![CompetitionRoundType.FINAL]!.id,
    ).toEqual(competitionRounds[2].id);

    expect(result[CategoryName.Poussin]![Sex.Male]).not.toHaveProperty(
      CompetitionRoundType.QUALIFIER,
    );

    expect(result[CategoryName.Poussin]![Sex.Male]).not.toHaveProperty(
      CompetitionRoundType.SEMI_FINAL,
    );

    expect(result[CategoryName.Poussin]![Sex.Female]).toHaveProperty(
      CompetitionRoundType.QUALIFIER,
    );

    expect(
      result[CategoryName.Poussin]![Sex.Female]![
        CompetitionRoundType.QUALIFIER
      ]!.id,
    ).toEqual(competitionRounds[0].id);

    expect(result[CategoryName.Poussin]![Sex.Female]).toHaveProperty(
      CompetitionRoundType.SEMI_FINAL,
    );

    expect(
      result[CategoryName.Poussin]![Sex.Female]![
        CompetitionRoundType.SEMI_FINAL
      ]!.id,
    ).toEqual(competitionRounds[1].id);

    expect(result[CategoryName.Poussin]![Sex.Female]).not.toHaveProperty(
      CompetitionRoundType.FINAL,
    );

    expect(result).not.toHaveProperty(CategoryName.Microbe);
    expect(result).not.toHaveProperty(CategoryName.Benjamin);
    expect(result).not.toHaveProperty(CategoryName.Minime);
    expect(result).not.toHaveProperty(CategoryName.Cadet);
    expect(result).not.toHaveProperty(CategoryName.Junior);
    expect(result).not.toHaveProperty(CategoryName.Senior);
    expect(result).not.toHaveProperty(CategoryName.Veteran);
  });

  it('assigns a judge to a boulder', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
      }),
    ];

    competition.boulderingRounds = ({
      async init(): Promise<Collection<BoulderingRound>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          getItems(): typeof competitionRounds {
            return competitionRounds;
          },
        };
      },
    } as unknown) as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.assignJudgeToBoulder.mockImplementation(
      async () => undefined,
    );

    await competitionService.assignJudgeToBoulder(1, 2, 3, 4, 5);

    expect(
      boulderingRoundServiceMock.assignJudgeToBoulder,
    ).toHaveBeenCalledTimes(1);

    expect(
      boulderingRoundServiceMock.assignJudgeToBoulder,
    ).toHaveBeenCalledWith(competitionRounds[0], 3, 4, 5);
  });

  it('throws not found when assigning a judge to a boulder with an inexistant competition', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.assignJudgeToBoulder(1, 2, 3, 4, 5),
    ).rejects.toBeInstanceOf(CompetitionNotFoundError);
  });

  it('throws not found when assigning a judge to a boulder with an inexistant round', () => {
    const competition = givenCompetition();

    competition.boulderingRounds = ({
      // eslint-disable-next-line sonarjs/no-identical-functions
      async init(): Promise<Collection<BoulderingRound>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          getItems(): BoulderingRound[] {
            return [];
          },
        };
      },
    } as unknown) as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.assignJudgeToBoulder(1, 2, 3, 4, 5),
    ).rejects.toBeInstanceOf(RoundNotFoundError);
  });

  it('deletes assignment of a judge to a boulder', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
      }),
    ];

    competition.boulderingRounds = ({
      // eslint-disable-next-line sonarjs/no-identical-functions
      async init(): Promise<Collection<BoulderingRound>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          getItems(): typeof competitionRounds {
            return competitionRounds;
          },
        };
      },
    } as unknown) as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.removeJudgeAssignmentToBoulder.mockImplementation(
      async () => undefined,
    );

    await competitionService.removeJudgeAssignmentToBoulder(1, 2, 3, 4, 5);

    expect(
      boulderingRoundServiceMock.removeJudgeAssignmentToBoulder,
    ).toHaveBeenCalledTimes(1);

    expect(
      boulderingRoundServiceMock.removeJudgeAssignmentToBoulder,
    ).toHaveBeenCalledWith(competitionRounds[0], 3, 4, 5);
  });

  it('throws not found when removing assignment of a judge to a boulder with an inexistant competition', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.removeJudgeAssignmentToBoulder(1, 2, 3, 4, 5),
    ).rejects.toBeInstanceOf(CompetitionNotFoundError);
  });

  it('throws not found when removing assignment of a judge to a boulder with an inexistant round', () => {
    const competition = givenCompetition();

    competition.boulderingRounds = ({
      // eslint-disable-next-line sonarjs/no-identical-functions
      async init(): Promise<Collection<BoulderingRound>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          getItems(): BoulderingRound[] {
            return [];
          },
        };
      },
    } as unknown) as Collection<BoulderingRound>;

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    return expect(
      competitionService.removeJudgeAssignmentToBoulder(1, 2, 3, 4, 5),
    ).rejects.toBeInstanceOf(RoundNotFoundError);
  });

  it('get group boulders', async () => {
    const competition = givenCompetition();

    const competitionRounds: BoulderingRound[] = [
      givenBoulderingRound({
        type: CompetitionRoundType.QUALIFIER,
      }),
    ];

    competition.boulderingRounds = ({
      // eslint-disable-next-line sonarjs/no-identical-functions
      async init(): Promise<Collection<BoulderingRound>> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return {
          getItems(): typeof competitionRounds {
            return competitionRounds;
          },
        };
      },
    } as unknown) as Collection<BoulderingRound>;

    const fakeBoulders: Boulder[] = [];

    competitionRepositoryMock.findOne.mockImplementation(
      async () => competition,
    );

    boulderingRoundServiceMock.getGroupBoulders.mockImplementation(
      async () => fakeBoulders,
    );

    const boulders = await competitionService.getGroupBoulders(1, 2, 3);

    expect(boulders).toBe(fakeBoulders);
    expect(boulderingRoundServiceMock.getGroupBoulders).toHaveBeenCalledTimes(
      1,
    );
    expect(boulderingRoundServiceMock.getGroupBoulders).toHaveBeenCalledWith(
      competitionRounds[0],
      3,
    );
  });

  it('throws competition not found when getting group boulders of an unknown competition', () => {
    competitionRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      competitionService.getGroupBoulders(1, 2, 3),
    ).rejects.toBeInstanceOf(CompetitionNotFoundError);
  });
});
