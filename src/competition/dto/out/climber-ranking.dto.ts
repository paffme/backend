import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../user/user.entity';

export class ClimberRankingDto {
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