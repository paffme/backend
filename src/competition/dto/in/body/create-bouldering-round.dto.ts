import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min, MinLength,
  ValidateNested,
} from 'class-validator';
import { BoulderingRoundType } from '../../../../bouldering/bouldering-round.entity';

export class CreateBoulderingRoundDto {
  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(0)
  index?: number;

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
