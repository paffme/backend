import { Collection, Entity, ManyToMany, OneToMany, Property } from 'mikro-orm';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';
import { BoulderingRound } from '../bouldering/bouldering-round.entity';

export enum CompetitionType {
  Bouldering = 'bouldering',
  Lead = 'lead',
  Speed = 'speed',
}

export enum Sex {
  Male = 'male',
  Female = 'female',
}

export enum CategoryName {
  Microbe = 'microbe',
  Poussin = 'poussin',
  Benjamin = 'benjamin',
  Minime = 'minime',
  Cadet = 'cadet',
  Junior = 'junior',
  Senior = 'senior',
  Veteran = 'veteran',
}

export interface Category {
  sex: Sex;
  name: CategoryName;
}

interface Ranking {
  ranking: number;
  climber: {
    id: typeof User.prototype.id;
    firstName: typeof User.prototype.firstName;
    lastName: typeof User.prototype.lastName;
    club: typeof User.prototype.club;
  };
}

@Entity()
// TODO : Refactor into multiple class when discriminator is available in MikroORM
export class Competition extends BaseEntity {
  @Property()
  name: string;

  @Property({
    type: String,
  })
  type: CompetitionType;

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
  rankings: Ranking[] = [];

  @OneToMany(
    () => CompetitionRegistration,
    (registration) => registration.competition,
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

  constructor(
    name: string,
    type: CompetitionType,
    startDate: Date,
    endDate: Date,
    address: string,
    city: string,
    postalCode: string,
    categories: Category[],
  ) {
    super();
    this.name = name;
    this.type = type;
    this.startDate = startDate;
    this.endDate = endDate;
    this.address = address;
    this.city = city;
    this.postalCode = postalCode;
    this.categories = categories;
  }
}

export type UserCompetitionRelation =
  | 'juryPresidents'
  | 'judges'
  | 'chiefRouteSetters'
  | 'routeSetters'
  | 'technicalDelegates'
  | 'organizers';

export type CompetitionRelation =
  | UserCompetitionRelation
  | 'registrations'
  | 'boulderingRounds';

// This is just for static validation
type CompetitionRelationValidation = Pick<Competition, CompetitionRelation>;
