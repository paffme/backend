import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import { Competition } from '../../competition/competition.entity';
import { BaseRound } from '../../competition/base-round';
import { User } from '../../user/user.entity';
import { BoulderingResult } from '../result/bouldering-result.entity';
import { BaseEntity } from '../../shared/base.entity';
import { Boulder } from '../boulder/boulder.entity';

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

export interface BaseBoulderingRoundRanking {
  ranking: number;
  climberId: typeof User.prototype.id;
}

export interface BoulderingRoundCountedRanking extends BaseBoulderingRoundRanking {
  tops: boolean[];
  topsInTries: number[];
  zones: boolean[];
  zonesInTries: number[];
}

export interface BoulderingRoundCircuitRankings {
  type: BoulderingRoundRankingType.CIRCUIT;
  rankings: BoulderingRoundCountedRanking[];
}

export interface BoulderingRoundLimitedContestRankings {
  type: BoulderingRoundRankingType.LIMITED_CONTEST;
  rankings: BoulderingRoundCountedRanking[];
}

export interface BoulderingRoundUnlimitedContestRanking
  extends BaseBoulderingRoundRanking {
  tops: boolean[];
  nbTops: number;
  points: number;
}

export interface BoulderingRoundUnlimitedContestRankings {
  type: BoulderingRoundRankingType.UNLIMITED_CONTEST;
  rankings: BoulderingRoundUnlimitedContestRanking[];
  bouldersPoints: number[];
}

export type BoulderingRoundRankings =
  | BoulderingRoundCircuitRankings
  | BoulderingRoundLimitedContestRankings
  | BoulderingRoundUnlimitedContestRankings;

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
  rankings?: BoulderingRoundRankings;

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
