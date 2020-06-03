import { ApiProperty } from '@nestjs/swagger';
import { Boulder } from '../../boulder/boulder.entity';
import { UserLimitedDto } from '../../../user/dto/out/user-limited.dto';

export class BoulderDto {
  @ApiProperty({
    type: Number,
  })
  readonly id!: typeof Boulder.prototype.id;

  @ApiProperty({
    isArray: true,
    type: UserLimitedDto,
  })
  readonly judges!: UserLimitedDto[];
}
