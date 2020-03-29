import { Collection, Entity, ManyToMany, OneToMany, Property } from 'mikro-orm';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { User } from '../user/user.entity';

export enum CompetitionType {
  Bouldering = 'bouldering',
  Lead = 'lead',
  Speed = 'speed',
  Combined = 'combined',
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

@Entity()
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
}
