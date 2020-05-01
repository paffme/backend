import { Injectable } from '@nestjs/common';
import { User } from '../../user/user.entity';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { UserLimitedDto } from '../../user/dto/out/user-limited.dto';

@Injectable()
export class LimitedUserMapper extends BaseMapper<UserLimitedDto, User> {
  constructor() {
    super({
      id: 'id',
      firstName: 'firstName',
      lastName: 'lastName',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    });
  }

  public map(user: User): UserLimitedDto {
    return morphism(this.schema, user);
  }

  public mapArray(users: User[]): UserLimitedDto[] {
    return users.map((u) => this.map(u));
  }
}
