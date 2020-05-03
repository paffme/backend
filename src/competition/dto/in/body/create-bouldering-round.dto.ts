import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoryName } from '../../../../shared/types/category-name.enum';
import { Sex } from '../../../../shared/types/sex.enum';

import {
  BoulderingRoundRankingType,
  BoulderingRoundType,
} from '../../../../bouldering/round/bouldering-round.entity';

export class CreateBoulderingRoundDto {
  @ApiProperty({
    enum: CategoryName,
  })
  @IsEnum(CategoryName)
  category!: CategoryName;

  @ApiProperty({
    enum: Sex,
  })
  @IsEnum(Sex)
  sex!: Sex;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTries?: number;

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

  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  groups?: number;
}
