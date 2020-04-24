import { ApiProperty } from '@nestjs/swagger';
import { Boulder } from '../../boulder/boulder.entity';

export class BoulderDto {
  @ApiProperty({
    type: Number,
  })
  readonly id!: typeof Boulder.prototype.id;

  @ApiProperty({
    type: Number,
  })
  readonly index!: typeof Boulder.prototype.index;
}
