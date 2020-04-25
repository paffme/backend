import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Competition } from '../../../competition.entity';

export class GetCompetitionByIdParams {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;
}
