import { IsEmail } from 'class-validator';
import { Entity, Property } from 'mikro-orm';
import { SystemRole } from './user-role.enum';
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
    type: String,
    hidden: true,
  })
  systemRole: SystemRole = SystemRole.User;

  @Property({ hidden: true, length: 512 })
  password: string;
}
