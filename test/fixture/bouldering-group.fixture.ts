import { BoulderingRound } from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';
import { Collection } from 'mikro-orm';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import TestUtils from '../utils';

const utils = new TestUtils();

export function givenBoulderingGroup(
  data?: Partial<BoulderingGroup>,
  boulders?: Partial<Collection<Boulder>>,
): BoulderingGroup {
  const group = new BoulderingGroup(
    data?.name ?? uuid.v4(),
    data?.round ?? ({} as BoulderingRound),
  );

  if (boulders) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    group.boulders = boulders;
  }

  group.id = utils.getRandomId();

  return group;
}
