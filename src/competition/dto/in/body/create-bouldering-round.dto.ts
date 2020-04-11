import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BoulderingRoundType } from '../../../../bouldering/bouldering-round.entity';

export class CreateBoulderingRoundDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  index!: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  insertBefore?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  insertAfter?: boolean;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quota!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  boulders!: number;

  @ApiProperty({
    enum: BoulderingRoundType,
  })
  @IsEnum(BoulderingRoundType)
  type!: BoulderingRoundType;
}
