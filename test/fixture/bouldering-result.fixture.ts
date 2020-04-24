import { User } from '../../src/user/user.entity';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';

export function givenResult(
  climber: User,
  boulder: Boulder,
  data?: Partial<BoulderingResult>,
): BoulderingResult {
  const result = new BoulderingResult(
    climber,
    (undefined as unknown) as BoulderingGroup,
    boulder,
  );

  result.top = data?.top ?? false;
  result.topInTries = data?.topInTries ?? 0;
  result.zone = data?.zone ?? false;
  result.zoneInTries = data?.zoneInTries ?? 0;
  result.tries = data?.tries ?? 0;

  return result;
}
