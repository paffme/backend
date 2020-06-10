import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

import { BoulderingRoundRankingType } from '../../../../bouldering/round/bouldering-round.entity';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { User } from '../../../../user/user.entity';
import { Type } from 'class-transformer';
import { Boulder } from '../../../../bouldering/boulder/boulder.entity';

class BaseResult {
  @ApiProperty({
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly climberId!: typeof User.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly boulderId!: typeof Boulder.prototype.id;
}

class ContestResult extends BaseResult {
  @ApiProperty()
  @IsBoolean()
  readonly top!: boolean;
}

class CircuitResult extends BaseResult {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly triesToTop?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly triesToZone?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly tries?: number;
}

type BulkResult = ContestResult | CircuitResult;

@ApiExtraModels(ContestResult, CircuitResult)
export class BulkBoulderingResultsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          $ref: getSchemaPath(ContestResult),
        },
        {
          $ref: getSchemaPath(CircuitResult),
        },
      ],
    },
  })
  readonly results!: BulkResult[];
}
