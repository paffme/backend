import { User } from '../../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RankingDto {
  @ApiProperty()
  ranking!: number;

  @ApiProperty()
  climber!: {
    id: typeof User.prototype.id;
    firstName: typeof User.prototype.firstName;
    lastName: typeof User.prototype.lastName;
    club: typeof User.prototype.club;
  };
}
