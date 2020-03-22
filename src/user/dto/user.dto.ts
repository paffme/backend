import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user-role.enum';
import { BaseDto } from '../../shared/base.dto';

export class UserDto extends BaseDto {
  @ApiProperty()
  readonly username: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty({
    enum: UserRole,
    isArray: true,
  })
  readonly roles: UserRole[];
}
