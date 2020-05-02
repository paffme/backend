import {
  BoulderingRound,
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../src/bouldering/round/bouldering-round.entity';
import * as uuid from 'uuid';
import { Competition } from '../../src/competition/competition.entity';
import { CategoryName } from '../../src/shared/types/category-name.enum';
import { Sex } from '../../src/shared/types/sex.enum';
import { Boulder } from '../../src/bouldering/boulder/boulder.entity';
import { BoulderingResult } from '../../src/bouldering/result/bouldering-result.entity';
import { BoulderingGroup } from '../../src/bouldering/group/bouldering-group.entity';
import { User } from '../../src/user/user.entity';
import { Collection } from 'mikro-orm';
import TestUtils from '../utils';

const utils = new TestUtils();

export function givenBoulderingRound(
  data?: Partial<BoulderingRound>,
  boulders?: Boulder[],
  results?: BoulderingResult[],
  climbers?: User[],
  groups?: Partial<Collection<BoulderingGroup>>,
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

  round.id = utils.getRandomId();
  round.state = data?.state ?? round.state;

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  round.groups = groups ?? {
    getItems(): BoulderingGroup[] {
      return [
        {
          id: 0,
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          results: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            init(): Promise<void> {
              return Promise.resolve();
            },
            getItems(): BoulderingResult[] {
              return results ?? [];
            },
          },
          boulders: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            init(): Promise<void> {
              return Promise.resolve();
            },
            count(): number {
              return boulders?.length ?? 0;
            },
          },
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          climbers: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            getItems(): User[] {
              return (
                climbers ??
                (results ? [...new Set(results.map((r) => r.climber))] : [])
              );
            },
          },
        },
      ];
    },
  };

  return round;
}
