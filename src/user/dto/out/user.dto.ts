import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDtoWithID } from '../../../shared/base.dto';
import { Sex } from '../../../shared/types/sex.enum';

export class UserDto extends BaseDtoWithID {
  @ApiProperty()
  readonly email!: string;

  @ApiProperty()
  readonly birthYear!: number;

  @ApiProperty()
  readonly sex!: Sex;

  @ApiProperty()
  readonly firstName!: string;

  @ApiProperty()
  readonly lastName!: string;

  @ApiPropertyOptional()
  readonly club?: string;
}
