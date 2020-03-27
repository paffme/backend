import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';

export class TokenResponseDto {
  @ApiProperty()
  readonly token: string;

  @ApiProperty()
  readonly userId: typeof User.prototype.id;

  @ApiProperty()
  readonly expiresIn: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
  })
  readonly createdAt: Date;
}
