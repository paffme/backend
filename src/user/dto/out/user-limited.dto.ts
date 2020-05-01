import { ApiProperty } from '@nestjs/swagger';
import { BaseDtoWithID } from '../../../shared/base.dto';

export class UserLimitedDto extends BaseDtoWithID {
  @ApiProperty()
  readonly firstName!: string;

  @ApiProperty()
  readonly lastName!: string;
}
