import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
  CircuitGroupDto,
  GroupDto,
  LimitedContestGroupDto,
  UnlimitedContestGroupDto,
} from './bouldering-round-rankings.dto';

@ApiExtraModels(
  UnlimitedContestGroupDto,
  LimitedContestGroupDto,
  CircuitGroupDto,
)
export class BoulderingGroupRankingsDto {
  @ApiProperty({ enum: BoulderingRoundRankingType })
  readonly type!: BoulderingRoundRankingType;

  @ApiProperty({
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
  })
  readonly group!: GroupDto;
}
