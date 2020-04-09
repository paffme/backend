import { Test } from '@nestjs/testing';
import { UserService } from '../../src/user/user.service';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { User } from '../../src/user/user.entity';
import { SharedModule } from '../../src/shared/shared.module';
import config from '../../src/mikro-orm.config';
import TestUtils from '../utils';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from '../../src/user/dto/in/body/update-user.dto';

describe('User service (integration)', () => {
  let userService: UserService;
  let utils: TestUtils;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
      imports: [
        MikroOrmModule.forRoot(config),
        MikroOrmModule.forFeature({ entities: [User] }),
        SharedModule,
      ],
    }).compile();

    userService = module.get(UserService);
    utils = new TestUtils(userService);
  });

  it('hash password on password update', async () => {
    const { user } = await utils.givenUser();
    const newPassword = String(Math.random());

    await userService.updateUser(user.id, {
      password: newPassword,
    });

    await userService.login({
      email: user.email,
      password: newPassword,
    });
  });

  it('rejects bad request when trying to login with an unknown user', async () => {
    return expect(
      userService.login({
        email: 'a@a.fr',
        password: String(Math.random()),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bad request when trying to login with an invalid password', async () => {
    const { user } = await utils.givenUser();

    return expect(
      userService.login({
        email: user.email,
        password: String(Math.random()),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reject conflict error when trying to create a user with an already existing email', async () => {
    const { user } = await utils.givenUser();

    return expect(
      userService.register({
        email: user.email,
        password: String(Math.random()),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reject not found error when getting an unknown user', () => {
    return expect(userService.getOrFail(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when deleting an unknown user', () => {
    return expect(userService.deleteById(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when updating an unknown user', () => {
    return expect(
      userService.updateUser(999999, {} as UpdateUserDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting registrations of an unknown user', () => {
    return expect(
      userService.getUserRegistrations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting jury presidents of an unknown user', () => {
    return expect(
      userService.getJuryPresidencies(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting judgements of an unknown user', () => {
    return expect(userService.getJudgements(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when getting chief route settings of an unknown user', () => {
    return expect(
      userService.getChiefRouteSettings(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting route settings of an unknown user', () => {
    return expect(userService.getRouteSettings(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns 404 when getting technical delegations of an unknown user', () => {
    return expect(
      userService.getTechnicalDelegations(999999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 when getting organizations of an unknown user', () => {
    return expect(userService.getOrganizations(999999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
