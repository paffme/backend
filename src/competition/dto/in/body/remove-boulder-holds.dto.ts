import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';

import {
  BoundingBoxCoordinates,
  BoundingBoxType,
} from '../../../../bouldering/boulder/boulder.entity';

import { Type } from 'class-transformer';

class BoundingBoxDto {
  @ApiProperty({ isArray: true, type: Number })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  coordinates!: BoundingBoxCoordinates;

  @ApiProperty({ enum: BoundingBoxType })
  @IsEnum(BoundingBoxType)
  type!: BoundingBoxType;
}

@ApiExtraModels(BoundingBoxDto)
export class RemoveBoulderHoldsDto {
  @ApiProperty({ isArray: true, type: BoundingBoxDto })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BoundingBoxDto)
  boundingBoxes!: BoundingBoxDto[];
}
