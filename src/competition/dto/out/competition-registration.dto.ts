import { ApiProperty } from '@nestjs/swagger';
import { Competition } from '../../competition.entity';
import { BaseDto } from '../../../shared/base.dto';
import { UserLimitedDto } from '../../../user/dto/out/user-limited.dto';

export class CompetitionRegistrationDto extends BaseDto {
  @ApiProperty({
    type: UserLimitedDto,
  })
  user!: UserLimitedDto;

  @ApiProperty({
    type: Number,
  })
  competitionId!: typeof Competition.prototype.id;
}
