import { User } from '../../src/user/user.entity';
import * as uuid from 'uuid';
import TestUtils from '../utils';
import { Sex } from '../../src/shared/types/sex.enum';

const utils = new TestUtils();

export function givenUser(data?: Partial<User>): User {
  const user = new User(
    data?.firstName ?? uuid.v4(),
    data?.lastName ?? uuid.v4(),
    data?.birthYear ?? 2000,
    data?.sex ?? Sex.Female,
    data?.email ?? uuid.v4(),
    data?.password ?? uuid.v4(),
  );

  user.id = data?.id ?? utils.getRandomId();

  return user;
}