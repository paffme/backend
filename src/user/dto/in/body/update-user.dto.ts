import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { RegisterDto } from './register.dto';

export class UpdateUserDto extends RegisterDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly username!: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  password!: string;
}
