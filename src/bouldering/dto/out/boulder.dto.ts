import { ApiProperty } from '@nestjs/swagger';
import { Boulder } from '../../boulder/boulder.entity';

export class BoulderDto {
  @ApiProperty({
    type: Number,
  })
  id!: typeof Boulder.prototype.id;

  @ApiProperty({
    type: Number,
  })
  index!: typeof Boulder.prototype.index;
}
