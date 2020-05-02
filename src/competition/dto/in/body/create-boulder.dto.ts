import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CreateBoulderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;
}
