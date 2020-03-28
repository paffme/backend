import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/user.entity';

export class CreateCompetitionRegistrationDto {
  @ApiProperty()
  readonly userId: typeof User.prototype.id;
}
