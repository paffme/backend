import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
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
