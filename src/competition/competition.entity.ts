import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  OneToMany,
  Property,
} from 'mikro-orm';

import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { BoulderingRound } from '../bouldering/round/bouldering-round.entity';
import { Sex } from '../shared/types/sex.enum';
import { CategoryName } from '../shared/types/category-name.enum';
import { CompetitionType } from './types/competition-type.enum';
import { Category } from '../shared/types/category.interface';
import { CompetitionRoundType } from './competition-round-type.enum';
import { ClimberRankingInfos } from './types/climber-ranking-infos.interface';

interface ClimberRanking {
  ranking: number;
  climber: ClimberRankingInfos;
}

export type Rankings = {
  [category in CategoryName]?: {
    [sex in Sex]?: ClimberRanking[];
  };
};

export enum CompetitionState {
  PENDING = 'PENDING',
  ONGOING = 'ONGOING',
  ENDED = 'ENDED',
}

@Entity()
// TODO : Refactor into multiple class when discriminator is available in MikroORM
export class Competition extends BaseEntity {
  @Property()
  name: string;

  @Enum(() => CompetitionState)
  state: CompetitionState;

  @Enum(() => CompetitionType)
  type: CompetitionType;

  @Property()
  cancelled = false;

  @Property({
    length: 1024,
  })
  description: string;

  @Property({
    length: 1024,
  })
  agenda: string;

  @Property()
  open: boolean;

  @Property()
  welcomingDate: Date;

  @Property()
  startDate: Date;

  @Property()
  endDate: Date;

  @Property()
  address: string;

  @Property()
  city: string;

  @Property()
  postalCode: string;

  @Property()
  categories: Category[];

  @OneToMany(() => BoulderingRound, (round) => round.competition, {
    orphanRemoval: true,
  })
  boulderingRounds = new Collection<BoulderingRound>(this);

  /*
    This will store the rankings based on the rounds results.

    It's recomputed after each new result :
    - It will allow better performances on read requests
    - It will allow storing rankings in the long term and prevent them to change
      if the ranking algorithm change
  */
  @Property()
  rankings: Rankings = {};

  @OneToMany(
    () => CompetitionRegistration,
    (registration) => registration.competition,
    {
      orphanRemoval: true,
    },
  )
  registrations = new Collection<CompetitionRegistration>(this);

  @ManyToMany(() => User, (juryPresident) => juryPresident.juryPresidencies, {
    owner: true,
    pivotTable: 'competition_to_jury_presidents',
  })
  juryPresidents = new Collection<User>(this);

  @ManyToMany(() => User, (judge) => judge.judgements, {
    owner: true,
    pivotTable: 'competition_to_judges',
  })
  judges = new Collection<User>(this);

  @ManyToMany(
    () => User,
    (chiefRouteSetter) => chiefRouteSetter.chiefRouteSettings,
    { owner: true, pivotTable: 'competition_to_chief_route_setters' },
  )
  chiefRouteSetters = new Collection<User>(this);

  @ManyToMany(() => User, (routeSetter) => routeSetter.routeSettings, {
    owner: true,
    pivotTable: 'competition_to_route_setters',
  })
  routeSetters = new Collection<User>(this);

  @ManyToMany(
    () => User,
    (technicalDelegate) => technicalDelegate.technicalDelegations,
    { owner: true, pivotTable: 'competition_to_technical_delegates' },
  )
  technicalDelegates = new Collection<User>(this);

  @ManyToMany(() => User, (owner) => owner.organizations, {
    owner: true,
    pivotTable: 'competition_to_organizers',
  })
  organizers = new Collection<User>(this);

  takesRegistrations(): boolean {
    return (
      this.state === CompetitionState.PENDING ||
      this.state === CompetitionState.ONGOING
    );
  }

  getQualifierRound(category: Category): BoulderingRound | undefined {
    return this.boulderingRounds
      .getItems()
      .find(
        (r) =>
          r.type === CompetitionRoundType.QUALIFIER &&
          r.category === category.name &&
          r.sex === category.sex,
      );
  }

  getSemiFinalRound(category: Category): BoulderingRound | undefined {
    return this.boulderingRounds
      .getItems()
      .find(
        (r) =>
          r.type === CompetitionRoundType.SEMI_FINAL &&
          r.category === category.name &&
          r.sex === category.sex,
      );
  }

  getPreviousRound(round: BoulderingRound): BoulderingRound | undefined {
    if (round.type === CompetitionRoundType.FINAL) {
      return this.getSemiFinalRound({
        sex: round.sex,
        name: round.category,
      });
    }

    if (round.type === CompetitionRoundType.SEMI_FINAL) {
      return this.getQualifierRound({
        sex: round.sex,
        name: round.category,
      });
    }
  }

  getSeason(): number {
    if (this.startDate.getMonth() >= 8) {
      return this.startDate.getFullYear();
    }

    return this.startDate.getFullYear() - 1;
  }

  constructor(
    name: string,
    type: CompetitionType,
    description: string,
    agenda: string,
    open: boolean,
    welcomingDate: Date,
    startDate: Date,
    endDate: Date,
    address: string,
    city: string,
    postalCode: string,
    categories: Category[],
    state: CompetitionState = CompetitionState.PENDING,
  ) {
    super();
    this.name = name;
    this.type = type;
    this.description = description;
    this.agenda = agenda;
    this.open = open;
    this.welcomingDate = welcomingDate;
    this.startDate = startDate;
    this.endDate = endDate;
    this.address = address;
    this.city = city;
    this.postalCode = postalCode;
    this.categories = categories;
    this.state = state;
  }
}

export type UserCompetitionRelation =
  | 'juryPresidents'
  | 'judges'
  | 'chiefRouteSetters'
  | 'routeSetters'
  | 'technicalDelegates'
  | 'organizers';

type Relations = UserCompetitionRelation | 'registrations' | 'boulderingRounds';

export type CompetitionRelation =
  | Relations
  | 'boulderingRounds.groups.climbers'
  | 'boulderingRounds.groups';

// This is just for static validation
type CompetitionRelationValidation = Pick<Competition, Relations>;
