import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../../../competition.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AddBoulderingRoundParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;
}
