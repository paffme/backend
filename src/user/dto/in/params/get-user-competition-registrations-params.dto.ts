import { IsInt } from 'class-validator';
import { User } from '../../../user.entity';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserCompetitionRegistrationsParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;
}
