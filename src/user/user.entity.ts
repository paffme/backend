import { IsEmail } from 'class-validator';
import { Collection, Entity, ManyToMany, OneToMany, Property } from 'mikro-orm';
import { SystemRole } from './user-role.enum';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { Competition } from '../competition/competition.entity';

export interface Permissions {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  users: typeof User.prototype.id[];
  competitions: typeof Competition.prototype.id[];
}

@Entity()
export class User extends BaseEntity {
  @Property({ hidden: true })
  @IsEmail()
  email!: string;

  @Property()
  firstName?: string;

  @Property()
  lastName?: string;

  @Property({
    type: String,
    hidden: true,
  })
  systemRole: SystemRole = SystemRole.User;

  @Property({
    hidden: true,
  })
  ownedResources: Permissions = {
    users: [],
    competitions: [],
  };

  @Property({ hidden: true, length: 512 })
  password!: string;

  @OneToMany(() => CompetitionRegistration, (item) => item.climber)
  registrations = new Collection<CompetitionRegistration>(this);

  @ManyToMany(() => Competition, (competition) => competition.juryPresidents)
  juryPresidencies = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.judges)
  judgements = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.chiefRouteSetters)
  chiefRouteSettings = new Collection<Competition>(this);

  @ManyToMany(() => Competition, (competition) => competition.routeSetters)
  routeSettings = new Collection<Competition>(this);

  @ManyToMany(
    () => Competition,
    (competition) => competition.technicalDelegates,
  )
  technicalDelegations = new Collection<Competition>(this);
}
