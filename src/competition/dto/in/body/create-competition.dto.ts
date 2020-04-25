import { ApiProperty } from '@nestjs/swagger';
import { Sex } from '../../../../shared/types/sex.enum';
import { CategoryName } from '../../../../shared/types/category-name.enum';
import { CompetitionType } from '../../../types/competition-type.enum';

import {
  IsArray,
  IsDateString,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

class CategoryDto {
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

export class CreateCompetitionDTO {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({
    enum: CompetitionType,
  })
  @IsEnum(CompetitionType)
  type!: CompetitionType;

  @ApiProperty()
  @IsDateString()
  startDate!: Date;

  @ApiProperty()
  @IsDateString()
  endDate!: Date;

  @ApiProperty()
  @IsString()
  address!: string;

  @ApiProperty()
  @IsString()
  city!: string;

  @ApiProperty()
  @IsString()
  postalCode!: string;

  @ApiProperty({
    type: CategoryDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  categories!: CategoryDto[];
}
