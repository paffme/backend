import { BaseRankingDto } from './base-ranking.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BoulderingUnlimitedContestRankingDto extends BaseRankingDto {
  @ApiProperty()
  nbTops!: number;

  @ApiProperty()
  points!: number;
}
