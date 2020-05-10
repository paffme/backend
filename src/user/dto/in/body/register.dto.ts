import {
  IsEmail,
  IsInt,
  IsString,
  Length,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  IsEnum,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Sex } from '../../../../shared/types/sex.enum';
import { Transform } from 'class-transformer';

@ValidatorConstraint({ name: 'BirthYear', async: false })
export class BirthYear implements ValidatorConstraintInterface {
  validate(birthYear: number): boolean {
    return new Date().getFullYear() - birthYear >= 7;
  }

  defaultMessage(): string {
    return '($value) is too young';
  }
}

export class RegisterDto {
  @ApiProperty({
    required: true,
  })
  @IsEmail()
  @Transform((email) => email.toLowerCase())
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

  @ApiProperty()
  @IsString()
  @Length(2, 32)
  readonly firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 32)
  readonly lastName!: string;

  @ApiProperty()
  @IsInt()
  @Validate(BirthYear)
  readonly birthYear!: number;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  readonly sex!: Sex;

  @ApiProperty()
  @IsString()
  @Length(2, 32)
  readonly club!: string;
}
