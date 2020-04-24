import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { Competition } from '../../src/competition/competition.entity';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Sex } from '../../src/shared/types/sex.enum';

export function givenBoulderingRound(
  data?: Partial<BoulderingRound>,
): BoulderingRound {
  const round = new BoulderingRound(
    data?.category ?? CategoryName.Minime,
    data?.sex ?? Sex.Female,
    data?.name ?? uuid.v4(),
    data?.index ?? 0,
    data?.quota ?? 0,
    data?.rankingType ?? BoulderingRoundRankingType.CIRCUIT,
    data?.type ?? BoulderingRoundType.QUALIFIER,
    data?.competition ?? ({} as Competition),
  );

  round.state = data?.state ?? round.state;

  return round;
}
