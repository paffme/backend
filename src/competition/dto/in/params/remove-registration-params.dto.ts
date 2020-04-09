import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../../../competition.entity';
import { User } from '../../../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveRegistrationParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;
}
