import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BoulderingRoundRankingType } from '../../../../bouldering/round/bouldering-round.entity';
import { CompetitionRoundType } from '../../../competition-round-type.enum';

export class UpdateBoulderingRoundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: BoulderingRoundRankingType,
  })
  @IsOptional()
  @IsEnum(BoulderingRoundRankingType)
  rankingType?: BoulderingRoundRankingType;

  @ApiPropertyOptional({
    enum: CompetitionRoundType,
  })
  @IsOptional()
  @IsEnum(CompetitionRoundType)
  type?: CompetitionRoundType;
}
