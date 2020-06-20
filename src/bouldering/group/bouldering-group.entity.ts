import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import { User } from '../../user/user.entity';
import { BaseEntity } from '../../shared/base.entity';
import { Boulder } from '../boulder/boulder.entity';
import { BoulderingResult } from '../result/bouldering-result.entity';

import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../round/bouldering-round.entity';

import type { BaseGroup } from '../../competition/base-group';
import type { ClimberRankingInfos } from '../types/climber-ranking-infos.interface';

export enum BoulderingGroupState {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

export interface BaseBoulderingRanking {
  ranking: number;
  tops: boolean[];
  climber: ClimberRankingInfos;
}

export interface BoulderingLimitedContestRanking extends BaseBoulderingRanking {
  topsInTries: number[];
  zones: boolean[];
  zonesInTries: number[];
}

export interface BoulderingCircuitRanking extends BaseBoulderingRanking {
  topsInTries: number[];
  zones: boolean[];
  zonesInTries: number[];
}

export interface BoulderingUnlimitedContestRanking
  extends BaseBoulderingRanking {
  nbTops: number;
  points: number;
}

export interface BoulderingCircuitRankings {
  type: BoulderingRoundRankingType.CIRCUIT;
  rankings: BoulderingCircuitRanking[];
}

export interface BoulderingLimitedContestRankings {
  type: BoulderingRoundRankingType.LIMITED_CONTEST;
  rankings: BoulderingLimitedContestRanking[];
}

export interface BoulderingUnlimitedContestRankings {
  type: BoulderingRoundRankingType.UNLIMITED_CONTEST;
  rankings: BoulderingUnlimitedContestRanking[];
  bouldersPoints: number[];
}

export type BoulderingGroupRankings =
  | BoulderingCircuitRankings
  | BoulderingLimitedContestRankings
  | BoulderingUnlimitedContestRankings;

@Entity()
export class BoulderingGroup extends BaseEntity
  implements BaseGroup<BoulderingRound> {
  @Property()
  name: string;

  @ManyToMany(() => User)
  climbers: Collection<User> = new Collection<User>(this);

  @OneToMany(() => Boulder, (boulder) => boulder.group, {
    orphanRemoval: true,
  })
  boulders: Collection<Boulder> = new Collection<Boulder>(this);

  // This will store all results for all the user in this round
  @OneToMany(
    () => BoulderingResult,
    (boulderingResult) => boulderingResult.group,
    {
      orphanRemoval: true,
    },
  )
  results: Collection<BoulderingResult> = new Collection<BoulderingResult>(
    this,
  );

  // This will store the computed rankings after each new result
  @Property()
  rankings?: BoulderingGroupRankings;

  @ManyToOne()
  round: BoulderingRound;

  @Enum(() => BoulderingGroupState)
  state: BoulderingGroupState = BoulderingGroupState.PENDING;

  constructor(name: string, round: BoulderingRound) {
    super();
    this.name = name;
    this.round = round;
  }
}
