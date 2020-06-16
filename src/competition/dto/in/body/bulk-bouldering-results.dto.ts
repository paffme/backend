import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { User } from '../../../../user/user.entity';
import { Type } from 'class-transformer';
import { Boulder } from '../../../../bouldering/boulder/boulder.entity';
import { BoulderingRoundRankingType } from '../../../../bouldering/round/bouldering-round.entity';

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

export class UnlimitedContestResult extends BaseResult {
  @ApiProperty()
  @IsBoolean()
  readonly top!: boolean;

  @ApiProperty()
  @IsString()
  @Equals(BoulderingRoundRankingType.UNLIMITED_CONTEST)
  readonly type!: BoulderingRoundRankingType.UNLIMITED_CONTEST;
}

export class CircuitResult extends BaseResult {
  @ApiProperty()
  @IsString()
  @Equals(BoulderingRoundRankingType.CIRCUIT)
  readonly type!: BoulderingRoundRankingType.CIRCUIT;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly topInTries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly zoneInTries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly top?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly zone?: boolean;
}

export class LimitedContestResult extends BaseResult {
  @ApiProperty()
  @IsString()
  @Equals(BoulderingRoundRankingType.LIMITED_CONTEST)
  readonly type!: BoulderingRoundRankingType.LIMITED_CONTEST;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly topInTries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly zoneInTries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly top?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly zone?: boolean;
}

export type BulkResult =
  | UnlimitedContestResult
  | LimitedContestResult
  | CircuitResult;

@ApiExtraModels(UnlimitedContestResult, LimitedContestResult, CircuitResult)
export class BulkBoulderingResultsDto {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          $ref: getSchemaPath(UnlimitedContestResult),
        },
        {
          $ref: getSchemaPath(LimitedContestResult),
        },
        {
          $ref: getSchemaPath(CircuitResult),
        },
      ],
    },
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested()
  @Type(() => BaseResult, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        {
          value: UnlimitedContestResult,
          name: BoulderingRoundRankingType.UNLIMITED_CONTEST,
        },
        {
          value: LimitedContestResult,
          name: BoulderingRoundRankingType.LIMITED_CONTEST,
        },
        {
          value: CircuitResult,
          name: BoulderingRoundRankingType.CIRCUIT,
        },
      ],
    },
  })
  readonly results!: BulkResult[];
}
