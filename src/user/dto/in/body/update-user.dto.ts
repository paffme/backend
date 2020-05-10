import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform((email) => email.toLowerCase())
  readonly email?: string;

  @ApiPropertyOptional({
    required: true,
    minLength: 6,
    maxLength: 32,
    type: String,
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @Length(6, 32)
  password?: string;
}
