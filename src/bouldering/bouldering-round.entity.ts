import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import { Competition } from '../competition/competition.entity';
import { BaseRound } from '../competition/base-round';
import { User } from '../user/user.entity';
import { BoulderingResult } from './bouldering-result.entity';
import { BaseEntity } from '../shared/base.entity';
import { Boulder } from './boulder.entity';

export enum BoulderingRoundRankingType {
  CIRCUIT = 'CIRCUIT',
  UNLIMITED_CONTEST = 'UNLIMITED_CONTEST',
  LIMITED_CONTEST = 'LIMITED_CONTEST',
}

export enum BoulderingRoundType {
  QUALIFIER = 'QUALIFIER',
  SEMI_FINAL = 'SEMI_FINAL',
  FINAL = 'FINAL',
}

export interface BaseBoulderingRanking {
  ranking: number;
  type: BoulderingRoundRankingType;
  climberId: typeof User.prototype.id;
}

export interface BoulderingCountedRanking extends BaseBoulderingRanking {
  tops: boolean[];
  topsInTries: number[];
  zones: boolean[];
  zonesInTries: number[];
}

export interface BoulderingCircuitRanking extends BoulderingCountedRanking {
  type: BoulderingRoundRankingType.CIRCUIT;
}

export interface BoulderingLimitedContestRanking
  extends BoulderingCountedRanking {
  type: BoulderingRoundRankingType.LIMITED_CONTEST;
}

export interface BoulderingUnlimitedContestRanking
  extends BaseBoulderingRanking {
  tops: boolean[];
  nbTops: number;
  points: number;
}

export type BoulderingRanking =
  | BoulderingCircuitRanking
  | BoulderingLimitedContestRanking
  | BoulderingUnlimitedContestRanking;

@Entity()
export class BoulderingRound extends BaseEntity
  implements BaseRound<BoulderingResult> {
  @Property()
  name: string;

  @Property()
  index: number;

  @Property()
  started = false;

  @Property()
  quota: number;

  @OneToMany(() => Boulder, (boulder) => boulder.round)
  boulders: Collection<Boulder> = new Collection<Boulder>(this);

  @ManyToOne()
  competition: Competition;

  @Enum()
  rankingType: BoulderingRoundRankingType;

  @Enum()
  type: BoulderingRoundType;

  @ManyToMany(() => User)
  climbers: Collection<User> = new Collection<User>(this);

  // This will store all results for all the user in this round
  @OneToMany(
    () => BoulderingResult,
    (boulderingResult) => boulderingResult.round,
  )
  results: Collection<BoulderingResult> = new Collection<BoulderingResult>(
    this,
  );

  /*
    This will store the round rankings based on results.

    It's recomputed after each new result :
    - It will allow better performances on read requests
    - It will allow storing rankings in the long term and prevent them to change
      if the ranking algorithm change
   */
  @Property()
  rankings: BoulderingRanking[] = [];

  constructor(
    name: string,
    index: number,
    quota: number,
    rankingType: BoulderingRoundRankingType,
    type: BoulderingRoundType,
    competition: Competition,
  ) {
    super();
    this.name = name;
    this.index = index;
    this.quota = quota;
    this.rankingType = rankingType;
    this.type = type;
    this.competition = competition;
  }
}
