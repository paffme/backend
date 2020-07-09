import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  BoundingBoxCoordinates,
  BoundingBoxType,
} from '../../../bouldering/boulder/boulder.entity';

class BoundingBoxDto {
  @ApiProperty({ isArray: true, type: Number })
  coordinates!: BoundingBoxCoordinates;

  @ApiProperty({ enum: BoundingBoxType })
  type!: BoundingBoxType;
}

@ApiExtraModels(BoundingBoxDto)
export class HoldsDto {
  @ApiProperty({
    isArray: true,
    type: BoundingBoxDto,
  })
  boundingBoxes!: BoundingBoxDto[];
}
