import {
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  Property,
} from 'mikro-orm';

import {
  BoulderingCircuitRanking,
  BoulderingGroup,
  BoulderingGroupState,
  BoulderingLimitedContestRanking,
  BoulderingUnlimitedContestRanking,
} from '../group/bouldering-group.entity';

import { Competition } from '../../competition/competition.entity';
import { BaseRound } from '../../competition/base-round';
import { BaseEntity } from '../../shared/base.entity';
import { CategoryName } from '../../shared/types/category-name.enum';
import { Sex } from '../../shared/types/sex.enum';
import { CompetitionRoundType } from '../../competition/competition-round-type.enum';
import { InternalServerErrorException } from '@nestjs/common';

export enum BoulderingRoundRankingType {
  CIRCUIT = 'CIRCUIT',
  UNLIMITED_CONTEST = 'UNLIMITED_CONTEST',
  LIMITED_CONTEST = 'LIMITED_CONTEST',
}

export interface BoulderingRoundCircuitRankings {
  type: BoulderingRoundRankingType.CIRCUIT;
  rankings: BoulderingCircuitRanking[];
}

export interface BoulderingRoundLimitedContestRankings {
  type: BoulderingRoundRankingType.LIMITED_CONTEST;
  rankings: BoulderingLimitedContestRanking[];
}

export interface BoulderingRoundUnlimitedContestRankings {
  type: BoulderingRoundRankingType.UNLIMITED_CONTEST;
  rankings: BoulderingUnlimitedContestRanking[];
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
