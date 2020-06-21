import { BaseRankingDto } from './base-ranking.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BoulderingLimitedContestRankingDto extends BaseRankingDto {
  @ApiProperty({ type: Number, isArray: true })
  topsInTries!: number[];

  @ApiProperty({ type: Boolean, isArray: true })
  zones!: boolean[];

  @ApiProperty({ type: Number, isArray: true })
  zonesInTries!: number[];
}
