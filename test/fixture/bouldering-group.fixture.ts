import { BoulderingRound } from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';

export function givenBoulderingGroup(
  data?: Partial<BoulderingGroup>,
): BoulderingGroup {
  return new BoulderingGroup(
    data?.name ?? uuid.v4(),
    data?.round ?? ({} as BoulderingRound),
  );
}
