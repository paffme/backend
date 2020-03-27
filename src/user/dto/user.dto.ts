import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '../../shared/base.dto';

export class UserDto extends BaseDto {
  @ApiProperty()
  readonly email: string;

  @ApiPropertyOptional()
  readonly firstName?: string;

  @ApiPropertyOptional()
  readonly lastName?: string;
}
