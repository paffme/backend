import { ApiProperty } from '@nestjs/swagger';
import { BoundingBox } from '../../../bouldering/boulder/boulder.entity';

export class HoldsDto {
  @ApiProperty({
    isArray: true,
  })
  boundingBoxes!: BoundingBox[];
}
