import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BirthYear } from './register.dto';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 32)
  readonly firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 32)
  readonly lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform((email) => email.toLowerCase())
  readonly email?: string;

  @ApiPropertyOptional({
    minLength: 6,
    maxLength: 32,
    type: String,
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @Length(6, 32)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 32)
  readonly club?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Validate(BirthYear)
  readonly birthYear?: number;
}
