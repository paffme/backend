import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';

export function givenBoulder(index: number): Boulder {
  return new Boulder((undefined as unknown) as BoulderingGroup, index);
}
