import { ApiProperty } from '@nestjs/swagger';
import { ClimberRankingDto } from '../../../competition/dto/out/climber-ranking.dto';

export class BaseRankingDto {
  @ApiProperty()
  ranking!: number;

  @ApiProperty({ isArray: true, type: Boolean })
  tops!: boolean[];

  @ApiProperty({ type: ClimberRankingDto })
  climber!: ClimberRankingDto;
}
