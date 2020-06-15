import { ApiProperty } from '@nestjs/swagger';
import { Sex } from '../../../../shared/types/sex.enum';
import { CategoryName } from '../../../../shared/types/category-name.enum';
import { CompetitionType } from '../../../types/competition-type.enum';

import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Length(2, 64)
  name!: string;

  @ApiProperty({
    enum: CompetitionType,
  })
  @IsEnum(CompetitionType)
  type!: CompetitionType;

  @ApiProperty()
  @IsString()
  @Length(10, 1024)
  description!: string;

  @ApiProperty()
  @IsString()
  @Length(10, 1024)
  agenda!: string;

  @ApiProperty()
  @IsBoolean()
  open!: boolean;

  @ApiProperty()
  @IsDateString()
  welcomingDate!: Date;

  @ApiProperty()
  @IsDateString()
  startDate!: Date;

  @ApiProperty()
  @IsDateString()
  endDate!: Date;

  @ApiProperty()
  @IsString()
  @Length(4, 128)
  address!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 64)
  city!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 12)
  postalCode!: string;

  @ApiProperty({
    type: CategoryDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories!: CategoryDto[];
}
