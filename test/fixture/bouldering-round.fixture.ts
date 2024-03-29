import {
  BoulderingRound,
  BoulderingRoundRankingType,
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
import { CompetitionRoundType } from '../../src/competition/competition-round-type.enum';

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
    data?.maxTries ?? 5,
    data?.rankingType ?? BoulderingRoundRankingType.CIRCUIT,
    data?.type ?? CompetitionRoundType.QUALIFIER,
    data?.competition ?? ({} as Competition),
  );

  round.id = utils.getRandomId();
  round.rankings = data?.rankings;

  const defaultGroups: BoulderingGroup[] = [
    {
      id: utils.getRandomId(),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      results: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        init(): Promise<void> {
          return Promise.resolve();
        },
        getItems(): BoulderingResult[] {
          return results ?? [];
        },
      },
      boulders: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        init(): Promise<void> {
          return Promise.resolve();
        },
        count(): number {
          return boulders?.length ?? 0;
        },
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      climbers: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  round.groups = groups ?? {
    getItems(): BoulderingGroup[] {
      return defaultGroups;
    },
  };

  round.groups.isInitialized = () => true;

  return round;
}
