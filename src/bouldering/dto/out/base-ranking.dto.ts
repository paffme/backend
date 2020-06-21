import { ApiProperty } from '@nestjs/swagger';
import { ClimberRankingInfosDto } from '../../../competition/dto/out/climber-ranking-infos.dto';

export class BaseRankingDto {
  @ApiProperty()
  ranking!: number;

  @ApiProperty({ isArray: true, type: Boolean })
  tops!: boolean[];

  @ApiProperty({ type: ClimberRankingInfosDto })
  climber!: ClimberRankingInfosDto;
}
