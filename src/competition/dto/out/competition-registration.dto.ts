import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../user/user.entity';
import { Competition } from '../../competition.entity';
import { BaseDto } from '../../../shared/base.dto';

export class CompetitionRegistrationDto extends BaseDto {
  @ApiProperty()
  userId: typeof User.prototype.id;

  @ApiProperty()
  competitionId: typeof Competition.prototype.id;
}
