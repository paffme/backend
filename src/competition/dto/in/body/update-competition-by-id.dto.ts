import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionType } from '../../../types/competition-type.enum';
import { Sex } from '../../../../shared/types/sex.enum';
import { CategoryName } from '../../../../shared/types/category-name.enum';

import {
  ArrayNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
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
  @Length(2, 64)
  name?: string;

  @ApiPropertyOptional({
    enum: CompetitionType,
  })
  @IsOptional()
  @IsEnum(CompetitionType)
  type?: CompetitionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(10, 1024)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(10, 1024)
  agenda?: string;

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
  @Length(4, 128)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 64)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 12)
  postalCode?: string;

  @ApiPropertyOptional({
    type: UpdateCategoryDto,
    isArray: true,
  })
  @IsOptional()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateCategoryDto)
  categories?: UpdateCategoryDto[];
}
