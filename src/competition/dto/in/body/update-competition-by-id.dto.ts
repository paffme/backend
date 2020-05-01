import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionType } from '../../../types/competition-type.enum';
import { Sex } from '../../../../shared/types/sex.enum';
import { CategoryName } from '../../../../shared/types/category-name.enum';

import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class UpdateCategoryDto {
  @ApiPropertyOptional({
    enum: Sex,
  })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({
    enum: CategoryName,
  })
  @IsOptional()
  @IsEnum(CategoryName)
  name?: CategoryName;
}

export class UpdateCompetitionByIdDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: CompetitionType,
  })
  @IsOptional()
  @IsEnum(CompetitionType)
  type?: CompetitionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    type: UpdateCategoryDto,
    isArray: true,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  categories?: UpdateCategoryDto[];
}
