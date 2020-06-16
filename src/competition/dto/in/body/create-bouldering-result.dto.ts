import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { User } from '../../../../user/user.entity';

export class CreateBoulderingResultDto {
  @ApiProperty({
    type: Number,
  })
  @IsInt()
  @Min(0)
  climberId!: typeof User.prototype.id;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  top?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  zone?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  try?: number;
}
