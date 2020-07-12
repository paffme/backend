import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  Min,
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
  @Min(0, { each: true })
  coordinates!: BoundingBoxCoordinates;

  @ApiProperty({ enum: BoundingBoxType })
  @IsEnum(BoundingBoxType)
  type!: BoundingBoxType;
}

@ApiExtraModels(BoundingBoxDto)
export class AddBoulderHoldsDto {
  @ApiProperty({ isArray: true, type: BoundingBoxDto })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BoundingBoxDto)
  boundingBoxes!: BoundingBoxDto[];
}
