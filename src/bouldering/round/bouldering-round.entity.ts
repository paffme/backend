import {
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import { Competition } from '../../competition/competition.entity';
import { BaseRound } from '../../competition/base-round';
import { User } from '../../user/user.entity';
import { BaseEntity } from '../../shared/base.entity';
import { CategoryName } from '../../shared/types/category-name.enum';
import { Sex } from '../../shared/types/sex.enum';
import { BoulderingGroup } from '../group/bouldering-group.entity';

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

interface BaseGroup<RankingType> {
  id: number;
  rankings: RankingType[];
}

export interface BaseBoulderingRoundRanking {
  ranking: number;
  climberId: typeof User.prototype.id;
}

export interface BoulderingRoundCountedRanking
  extends BaseBoulderingRoundRanking {
  tops: boolean[];
  topsInTries: number[];
  zones: boolean[];
  zonesInTries: number[];
}

export interface BoulderingRoundCircuitRankings {
  type: BoulderingRoundRankingType.CIRCUIT;
  groups: BaseGroup<BoulderingRoundCountedRanking>[];
}

export interface BoulderingRoundLimitedContestRankings {
  type: BoulderingRoundRankingType.LIMITED_CONTEST;
  groups: BaseGroup<BoulderingRoundCountedRanking>[];
}

export interface BoulderingRoundUnlimitedContestRanking
  extends BaseBoulderingRoundRanking {
  tops: boolean[];
  nbTops: number;
  points: number;
}

interface BoulderingRoundUnlimitedContestGroup<RankingType>
  extends BaseGroup<RankingType> {
  bouldersPoints: number[];
}

export interface BoulderingRoundUnlimitedContestRankings {
  type: BoulderingRoundRankingType.UNLIMITED_CONTEST;
  groups: BoulderingRoundUnlimitedContestGroup<
    BoulderingRoundUnlimitedContestRanking
  >[];
}

export type BoulderingRoundRankings =
  | BoulderingRoundCircuitRankings
  | BoulderingRoundLimitedContestRankings
  | BoulderingRoundUnlimitedContestRankings;

export enum BoulderingRoundState {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

@Entity()
export class BoulderingRound extends BaseEntity
  implements BaseRound<BoulderingGroup> {
  @Enum(() => CategoryName)
  category: CategoryName;

  @Enum(() => Sex)
  sex: Sex;

  @Property()
  name: string;

  @Enum(() => BoulderingRoundState)
  state: BoulderingRoundState = BoulderingRoundState.PENDING;

  @Property()
  index: number;

  @Property()
  started = false;

  @Property()
  quota: number;

  @ManyToOne()
  competition: Competition;

  @Enum(() => BoulderingRoundRankingType)
  rankingType: BoulderingRoundRankingType;

  @Enum(() => BoulderingRoundType)
  type: BoulderingRoundType;

  @OneToMany(() => BoulderingGroup, (group) => group.round, {
    orphanRemoval: true,
  })
  groups: Collection<BoulderingGroup> = new Collection<BoulderingGroup>(this);

  /*
    This will store the round rankings based on results.

    It's recomputed after each new result :
    - It will allow better performances on read requests
    - It will allow storing rankings in the long term and prevent them to change
      if the ranking algorithm change
   */
  @Property()
  rankings?: BoulderingRoundRankings;

  takesNewClimbers(): boolean {
    return (
      this.state === BoulderingRoundState.PENDING ||
      this.state === BoulderingRoundState.ONGOING
    );
  }

  isRankingWithCountedTries(): boolean {
    return (
      this.rankingType === BoulderingRoundRankingType.LIMITED_CONTEST ||
      this.rankingType === BoulderingRoundRankingType.CIRCUIT
    );
  }

  isRankingWithCountedZones(): boolean {
    return this.isRankingWithCountedTries();
  }

  constructor(
    category: CategoryName,
    sex: Sex,
    name: string,
    index: number,
    quota: number,
    rankingType: BoulderingRoundRankingType,
    type: BoulderingRoundType,
    competition: Competition,
  ) {
    super();
    this.category = category;
    this.sex = sex;
    this.name = name;
    this.index = index;
    this.quota = quota;
    this.rankingType = rankingType;
    this.type = type;
    this.competition = competition;
  }
}

export type BoulderingRoundRelation = 'groups' | 'competition';

// This is just for static validation
type BoulderingRoundRelationValidation = Pick<
  BoulderingRound,
  BoulderingRoundRelation
>;
