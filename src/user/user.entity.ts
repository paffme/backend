import { IsEmail } from 'class-validator';
import { Collection, Entity, OneToMany, Property } from 'mikro-orm';
import { SystemRole } from './user-role.enum';
import { BaseEntity } from '../shared/base.entity';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';

@Entity()
export class User extends BaseEntity {
  @Property({ hidden: true })
  @IsEmail()
  email: string;

  @Property()
  firstName?: string;

  @Property()
  lastName?: string;

  @Property({
    type: String,
    hidden: true,
  })
  systemRole: SystemRole = SystemRole.User;

  @Property({ hidden: true, length: 512 })
  password: string;

  @OneToMany(() => CompetitionRegistration, (item) => item.climber)
  registrations = new Collection<CompetitionRegistration>(this);
}
