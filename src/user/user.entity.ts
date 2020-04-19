import { IsEmail } from 'class-validator';
import { Collection, Entity, ManyToMany, OneToMany, Property } from 'mikro-orm';
import { SystemRole } from './user-role.enum';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { Competition } from '../competition/competition.entity';

@Entity()
export class User extends BaseEntity {
  @Property({ hidden: true })
  @IsEmail()
  email: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property()
  club?: string;

  @Property({
    type: String,
    hidden: true,
  })
  systemRole: SystemRole = SystemRole.User;

  @Property({ hidden: true, length: 512 })
  password: string;

  @OneToMany(() => CompetitionRegistration, (item) => item.climber)
  registrations: Collection<CompetitionRegistration> = new Collection<
    CompetitionRegistration
  >(this);

  @ManyToMany(() => Competition, (competition) => competition.juryPresidents)
  juryPresidencies: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.judges)
  judgements: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.chiefRouteSetters)
  chiefRouteSettings: Collection<Competition> = new Collection<Competition>(
    this,
  );

  @ManyToMany(() => Competition, (competition) => competition.routeSetters)
  routeSettings: Collection<Competition> = new Collection<Competition>(this);

  @ManyToMany(
    () => Competition,
    (competition) => competition.technicalDelegates,
  )
  technicalDelegations: Collection<Competition> = new Collection<Competition>(
    this,
  );

  @ManyToMany(() => Competition, (competition) => competition.organizers)
  organizations: Collection<Competition> = new Collection<Competition>(this);

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    super();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email.trim();
    this.password = password;
  }
}

export type UserRelation =
  | 'registrations'
  | 'juryPresidencies'
  | 'judgements'
  | 'chiefRouteSettings'
  | 'routeSettings'
  | 'technicalDelegations'
  | 'organizations';

// This is just for static validation
type CompetitionRelationValidation = Pick<User, UserRelation>;
