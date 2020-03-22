import { IsEmail } from 'class-validator';
import { Entity, Property } from 'mikro-orm';
import { UserRole } from './user-role.enum';
import { BaseEntity } from '../shared/base.entity';

@Entity()
export class User extends BaseEntity<User> {
  @Property({ hidden: true })
  @IsEmail()
  email: string;

  @Property()
  firstName?: string;

  @Property()
  lastName?: string;

  @Property({
    default: [],
  })
  roles: UserRole[];

  @Property({ hidden: true })
  password: string;
}
