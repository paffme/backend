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

const userRepositoryMock: RepositoryMock = {
  persistAndFlush: jest.fn(),
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
          useFactory: (): {} => ({}),
        },
      ],
    }).compile();

    userService = module.get(UserService);
  });

  afterAll(() => {
    jest.clearAllMocks();
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
});
