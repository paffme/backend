import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import {
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../../../bouldering/bouldering-round.entity';

export class CreateBoulderingRoundDto {
  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quota!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  boulders!: number;

  @ApiProperty({
    enum: BoulderingRoundRankingType,
  })
  @IsEnum(BoulderingRoundRankingType)
  rankingType!: BoulderingRoundRankingType;

  @ApiProperty({
    enum: BoulderingRoundType,
  })
  @IsEnum(BoulderingRoundType)
  type!: BoulderingRoundType;
}
