import { Test } from '@nestjs/testing';
import { UserService } from '../../src/user/user.service';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { User } from '../../src/user/user.entity';
import { SharedModule } from '../../src/shared/shared.module';
import config from '../../src/mikro-orm.config';
import TestUtils from '../utils';

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
});
