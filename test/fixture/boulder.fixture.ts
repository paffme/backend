import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';
import TestUtils from '../utils';

const utils = new TestUtils();

export function givenBoulder(index: number): Boulder {
  const boulder = new Boulder((undefined as unknown) as BoulderingGroup, index);
  boulder.id = utils.getRandomId();
  return boulder;
}
