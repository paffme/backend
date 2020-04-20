import { User } from '../../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

class Climber {
  @ApiProperty({
    type: Number,
  })
  id!: typeof User.prototype.id;

  @ApiProperty({
    type: String,
  })
  firstName!: typeof User.prototype.firstName;

  @ApiProperty({
    type: String,
  })
  lastName!: typeof User.prototype.lastName;

  @ApiProperty({
    type: String,
  })
  club!: typeof User.prototype.club;
}

export class RankingDto {
  @ApiProperty()
  ranking!: number;

  @ApiProperty()
  climber!: Climber;
}
