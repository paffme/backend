import { BoulderingRound } from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import TestUtils from '../utils';
import { User } from '../../src/user/user.entity';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';

const utils = new TestUtils();

export function givenBoulderingGroup(
  data?: Partial<BoulderingGroup>,
  boulders?: Partial<Boulder>[],
  climbers?: Partial<User>[],
  results?: Partial<BoulderingResult>[],
): BoulderingGroup {
  const group = new BoulderingGroup(
    data?.name ?? uuid.v4(),
    data?.round ?? ({} as BoulderingRound),
  );

  if (data?.state) {
    group.state = data.state;
  }

  if (boulders) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    group.boulders = {
      contains(item: Boulder): boolean {
        return boulders.includes(item);
      },
      getItems(): Boulder[] {
        return boulders as Boulder[];
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async init() {
        return group.boulders;
      },
      async loadItems(): Promise<Boulder[]> {
        return boulders as Boulder[];
      },
      count(): number {
        return boulders.length;
      },
    };
  }

  if (climbers) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    group.climbers = {
      contains(item: User): boolean {
        return climbers.includes(item);
      },
      getItems(): User[] {
        return climbers as User[];
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async init() {
        return group.climbers;
      },
      async loadItems(): Promise<User[]> {
        return climbers as User[];
      },
    };
  }

  if (results) {
    group.results = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async init() {
        return results;
      },
      getItems(): BoulderingResult[] {
        return results as BoulderingResult[];
      },
    };
  }

  group.id = utils.getRandomId();

  return group;
}
