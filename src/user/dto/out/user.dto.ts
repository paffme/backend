import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDtoWithID } from '../../../shared/base.dto';

export class UserDto extends BaseDtoWithID {
  @ApiProperty()
  readonly email: string;

  @ApiPropertyOptional()
  readonly firstName?: string;

  @ApiPropertyOptional()
  readonly lastName?: string;
}
