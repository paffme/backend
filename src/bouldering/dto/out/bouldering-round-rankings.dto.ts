import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { BoulderingGroup } from '../../group/bouldering-group.entity';
import { User } from '../../../user/user.entity';

export class BaseGroupDto {
  @ApiProperty({ type: Number })
  readonly id!: typeof BoulderingGroup.prototype.id;
}

class ClimberDto {
  @ApiProperty({
    type: Number,
  })
  id!: typeof User.prototype.id;

  @ApiProperty({
    type: String,
  })
  firstName!: typeof User.prototype.firstName;

  @ApiProperty({
    type: String,
  })
  lastName!: typeof User.prototype.lastName;

  @ApiProperty({
    type: String,
  })
  club!: typeof User.prototype.club;
}

class BaseRoundRankingDto {
  @ApiProperty()
  readonly ranking!: number;

  @ApiProperty({ type: ClimberDto })
  readonly climber!: ClimberDto;

  @ApiProperty({ type: Boolean, isArray: true })
  readonly tops!: boolean[];
}

export class CountedRankingDto extends BaseRoundRankingDto {
  @ApiProperty({
    isArray: true,
    type: Number,
  })
  readonly topsInTries!: number[];

  @ApiProperty({ type: Boolean, isArray: true })
  readonly zones!: boolean[];

  @ApiProperty({
    isArray: true,
    type: Number,
  })
  readonly zonesInTries!: number[];
}

class UnlimitedContestRankingDto extends BaseRoundRankingDto {
  @ApiProperty()
  readonly nbTops!: number;

  @ApiProperty()
  readonly points!: number;
}

export class UnlimitedContestGroupDto extends BaseGroupDto {
  @ApiProperty({
    isArray: true,
    type: Number,
  })
  readonly bouldersPoints!: number[];

  @ApiProperty({
    isArray: true,
    type: BaseRoundRankingDto,
  })
  readonly rankings!: UnlimitedContestRankingDto[];
}

export class LimitedContestGroupDto extends BaseGroupDto {
  @ApiProperty({
    isArray: true,
    type: CountedRankingDto,
  })
  readonly rankings!: CountedRankingDto[];
}

export class CircuitGroupDto extends BaseGroupDto {
  @ApiProperty({
    isArray: true,
    type: CountedRankingDto,
  })
  readonly rankings!: CountedRankingDto[];
}

export type GroupDto =
  | UnlimitedContestGroupDto
  | LimitedContestGroupDto
  | CircuitGroupDto;

@ApiExtraModels(
  UnlimitedContestGroupDto,
  LimitedContestGroupDto,
  CircuitGroupDto,
)
export class BoulderingRoundRankingsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          $ref: getSchemaPath(UnlimitedContestGroupDto),
        },
        {
          $ref: getSchemaPath(LimitedContestGroupDto),
        },
        {
          $ref: getSchemaPath(CircuitGroupDto),
        },
      ],
    },
  })
  readonly groups!: GroupDto[];
}
