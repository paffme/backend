import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateBoulderingResultDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  boulderId!: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  top?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  zone?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  try?: boolean;
}
