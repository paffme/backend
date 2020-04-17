import { ApiProperty } from '@nestjs/swagger';
import { Boulder } from '../../boulder.entity';

export class BoulderDto {
  @ApiProperty({
    type: typeof Boulder.prototype.id,
  })
  id!: typeof Boulder.prototype.id;

  @ApiProperty({
    type: typeof Boulder.prototype.index,
  })
  index!: typeof Boulder.prototype.index;
}
