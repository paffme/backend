import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { Type } from 'class-transformer';

class UpdateCategoryDto {
  @ApiProperty({
    enum: Sex,
  })
  @IsEnum(Sex)
  sex!: Sex;

  @ApiProperty({
    enum: CategoryName,
  })
  @IsEnum(CategoryName)
  name!: CategoryName;
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
  @Type(() => UpdateCategoryDto)
  categories?: UpdateCategoryDto[];
}
