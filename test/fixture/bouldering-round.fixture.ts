import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { Competition } from '../../src/competition/competition.entity';

export function givenBoulderingRound(
  data?: Partial<BoulderingRound>,
): BoulderingRound {
  return new BoulderingRound(
    data?.name ?? uuid.v4(),
    data?.index ?? 0,
    data?.quota ?? 0,
    data?.rankingType ?? BoulderingRoundRankingType.CIRCUIT,
    data?.type ?? BoulderingRoundType.QUALIFIER,
    data?.competition ?? ({} as Competition),
  );
}
