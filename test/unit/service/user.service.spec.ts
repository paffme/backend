import { Test } from '@nestjs/testing';
import { UserService } from '../../../src/user/user.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from '../../../src/user/dto/in/body/update-user.dto';
import { getRepositoryToken } from 'nestjs-mikro-orm';
import { User } from '../../../src/user/user.entity';
import { RepositoryMock } from '../mocks/types';
import { UserMapper } from '../../../src/shared/mappers/user.mapper';
import { AuthenticationService } from '../../../src/shared/authentication/authentication.service';
import { ConfigurationService } from '../../../src/shared/configuration/configuration.service';
import { JwtService } from '@nestjs/jwt';
import { JWT_MODULE_OPTIONS } from '@nestjs/jwt/dist/jwt.constants';
import * as uuid from 'uuid';
import { Sex } from '../../../src/shared/types/sex.enum';
import { QueryOrder } from 'mikro-orm';
import { CompetitionState } from '../../../src/competition/competition.entity';
import { UserNotFoundError } from '../../../src/user/errors/user-not-found.error';

const userRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
};

describe('User service (unit)', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        UserMapper,
        AuthenticationService,
        ConfigurationService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useFactory: (): typeof userRepositoryMock => userRepositoryMock,
        },
        {
          provide: JWT_MODULE_OPTIONS,
          useFactory: (): Record<string, unknown> => ({}),
        },
      ],
    }).compile();

    userService = module.get(UserService);
  });

  it('gets user with pagination, filtering and ordering', async () => {
    const data: unknown[] = [];
    userRepositoryMock.findAndCount.mockImplementation(async () => [data, 0]);

    const res = await userService.get(
      {
        limit: 10,
        offset: 11,
      },
      {
        filter: {
          firstName: '123',
        },
        order: {
          firstName: QueryOrder.asc,
        },
      },
    );

    expect(userRepositoryMock.findAndCount).toHaveBeenCalledTimes(1);
    expect(userRepositoryMock.findAndCount).toHaveBeenCalledWith(
      {
        firstName: '123',
      },
      {
        limit: 10,
        offset: 11,
        orderBy: {
          firstName: QueryOrder.asc,
        },
      },
    );

    expect(res.total).toEqual(0);
    expect(res.data).toBe(data);
  });

  it('rejects bad request when trying to login with an unknown user', async () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.login({
        email: 'a@a.fr',
        password: String(Math.random()),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bad request when trying to login with an invalid password', async () => {
    userRepositoryMock.findOne.mockImplementation(async () => ({
      password: '123$456$789',
    }));

    return expect(
      userService.login({
        email: 'super@email.com',
        password: String(Math.random()),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reject conflict error when trying to create a user with an already existing email', async () => {
    userRepositoryMock.count.mockImplementation(() => 1);

    return expect(
      userService.register({
        firstName: uuid.v4(),
        lastName: uuid.v4(),
        email: 'super@email.com',
        password: String(Math.random()),
        birthYear: 2000,
        sex: Sex.Female,
        club: uuid.v4(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reject not found error when getting an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(userService.getOrFail(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when deleting an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(userService.deleteById(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when updating an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.updateUser(999999, {} as UpdateUserDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting registrations of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getUserRegistrations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting jury presidents of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getJuryPresidencies(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting judgements of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(userService.getJudgements(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when getting chief route settings of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getChiefRouteSettings(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting route settings of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(userService.getRouteSettings(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when getting technical delegations of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getTechnicalDelegations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting organizations of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(userService.getOrganizations(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('gets user competition roles', async () => {
    const initMocks: jest.Mock[] = [];

    const getInitMock = (count: number): jest.Mock => {
      const mock = jest.fn().mockImplementation(async () => ({
        count(): number {
          return count;
        },
      }));

      initMocks.push(mock);
      return mock;
    };

    userRepositoryMock.findOne.mockImplementation(async () => ({
      organizations: {
        init: getInitMock(1),
      },
      juryPresidencies: {
        init: getInitMock(1),
      },
      judgements: {
        init: getInitMock(1),
      },
      chiefRouteSettings: {
        init: getInitMock(1),
      },
      routeSettings: {
        init: getInitMock(1),
      },
      technicalDelegations: {
        init: getInitMock(0),
      },
    }));

    const result = await userService.getCompetitionRoles(1, 2);

    expect(result.organizer).toEqual(true);
    expect(result.juryPresident).toEqual(true);
    expect(result.judge).toEqual(true);
    expect(result.chiefRouteSetter).toEqual(true);
    expect(result.routeSetter).toEqual(true);
    expect(result.technicalDelegate).toEqual(false);
    expect(userRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
      { id: 1 },
      undefined,
    );

    for (const initMock of initMocks) {
      expect(initMock).toHaveBeenCalledTimes(1);
      expect(initMock).toHaveBeenCalledWith({
        where: {
          id: 2,
        },
      });
    }
  });

  it('counts', async () => {
    userRepositoryMock.count.mockImplementation(async () => 15);
    const res = await userService.count();
    expect(res).toEqual(15);
  });

  it('gets judgement assignments', async () => {
    const fakeAssignments = {};
    const user = {
      judgedBoulders: {
        getItems: jest.fn(),
      },
    };

    user.judgedBoulders.getItems.mockImplementation(() => fakeAssignments);
    userRepositoryMock.findOne.mockImplementation(async () => user);

    const assignments = await userService.getJudgementAssignments(1);

    expect(assignments).toBe(fakeAssignments);
    expect(userRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
      {
        id: 1,
        judgedBoulders: {
          group: {
            state: CompetitionState.ONGOING,
          },
        },
      },
      ['judgedBoulders.group.round.competition'],
    );
  });

  it('throws user not found when getting assignments of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getJudgementAssignments(1),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('gets judgement assignments in a competition', async () => {
    const fakeAssignments = {};
    const user = {
      judgedBoulders: {
        getItems: jest.fn(),
      },
    };

    user.judgedBoulders.getItems.mockImplementation(() => fakeAssignments);
    userRepositoryMock.findOne.mockImplementation(async () => user);

    const assignments = await userService.getCompetitionJudgementAssignments(
      1,
      2,
    );

    expect(assignments).toBe(fakeAssignments);
    expect(userRepositoryMock.findOne).toHaveBeenCalledTimes(1);
    expect(userRepositoryMock.findOne).toHaveBeenCalledWith(
      {
        id: 1,
        judgedBoulders: {
          group: {
            state: CompetitionState.ONGOING,
            round: {
              competition: {
                id: 2,
              },
            },
          },
        },
      },
      ['judgedBoulders.group.round.competition'],
    );
  });

  it('throws user not found when getting assignments in a competition of an unknown user', () => {
    userRepositoryMock.findOne.mockImplementation(async () => undefined);

    return expect(
      userService.getCompetitionJudgementAssignments(1, 2),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
