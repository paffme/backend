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
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../group/bouldering-group.entity';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';
import { InternalServerErrorException } from '@nestjs/common';

export enum BoulderingRoundRankingType {
  CIRCUIT = 'CIRCUIT',
  UNLIMITED_CONTEST = 'UNLIMITED_CONTEST',
  LIMITED_CONTEST = 'LIMITED_CONTEST',
}

export interface BaseGroup<RankingType extends BaseBoulderingRoundRanking> {
  id: number;
  rankings: RankingType[];
}

export interface ClimberRankingInfos {
  id: typeof User.prototype.id;
  firstName: typeof User.prototype.firstName;
  lastName: typeof User.prototype.lastName;
  club: typeof User.prototype.club;
}

export interface BaseBoulderingRoundRanking {
  ranking: number;
  tops: boolean[];
  climber: ClimberRankingInfos;
}

export interface BoulderingRoundCountedRanking
  extends BaseBoulderingRoundRanking {
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
  nbTops: number;
  points: number;
}

export interface BoulderingRoundUnlimitedContestGroup<
  RankingType extends BaseBoulderingRoundRanking
> extends BaseGroup<RankingType> {
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

  @Property()
  maxTries?: number;

  @Property()
  started = false;

  @Property()
  quota = 0;

  @ManyToOne()
  competition: Competition;

  @Enum(() => BoulderingRoundRankingType)
  rankingType: BoulderingRoundRankingType;

  @Enum(() => CompetitionRoundType)
  type: CompetitionRoundType;

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

  get state(): BoulderingRoundState {
    if (!this.groups.isInitialized()) {
      throw new InternalServerErrorException('Groups not initialized');
    }

    const groups = this.groups.getItems();

    if (groups.every((g) => g.state === BoulderingGroupState.ENDED)) {
      return BoulderingRoundState.ENDED;
    }

    if (groups.some((g) => g.state === BoulderingGroupState.ONGOING)) {
      return BoulderingRoundState.ONGOING;
    }

    return BoulderingRoundState.PENDING;
  }

  takesNewClimbers(): boolean {
    const state = this.state;

    return (
      state === BoulderingRoundState.PENDING ||
      state === BoulderingRoundState.ONGOING
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
    maxTries: number | undefined,
    rankingType: BoulderingRoundRankingType,
    type: CompetitionRoundType,
    competition: Competition,
  ) {
    super();
    this.category = category;
    this.sex = sex;
    this.name = name;
    this.maxTries = maxTries;
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
