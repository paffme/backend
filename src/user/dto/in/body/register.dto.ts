import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    required: true,
  })
  @IsEmail()
  readonly email!: string;

  @ApiProperty({
    required: true,
    minLength: 6,
    maxLength: 32,
    type: String,
    format: 'password',
  })
  @IsString()
  @Length(6, 32)
  readonly password!: string;
}
