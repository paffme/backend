import { Injectable } from '@nestjs/common';
import { UserDto } from '../../user/dto/user.dto';
import { User } from '../../user/user.entity';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';

@Injectable()
export class UserMapper extends BaseMapper<UserDto, User> {
  constructor() {
    super({
      id: 'id',
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      roles: 'roles',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    });
  }

  public map(user: User): UserDto {
    return morphism(this.schema, user);
  }

  public mapArray(users: User[]): UserDto[] {
    return users.map((u) => this.map(u));
  }
}
