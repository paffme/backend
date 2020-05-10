import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoryName } from '../../../../shared/types/category-name.enum';
import { Sex } from '../../../../shared/types/sex.enum';
import { BoulderingRoundRankingType } from '../../../../bouldering/round/bouldering-round.entity';
import { CompetitionRoundType } from '../../../competition-round-type.enum';

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
    enum: CompetitionRoundType,
  })
  @IsEnum(CompetitionRoundType)
  type!: CompetitionRoundType;

  @ApiPropertyOptional({
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  groups?: number;
}
