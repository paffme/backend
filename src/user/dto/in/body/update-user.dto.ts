import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  password?: string;
}
