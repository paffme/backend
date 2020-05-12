import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { Competition } from '../../../competition.entity';
import { User } from '../../../../user/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BoulderingRound } from '../../../../bouldering/round/bouldering-round.entity';
import { BoulderingGroup } from '../../../../bouldering/group/bouldering-group.entity';
import { Boulder } from '../../../../bouldering/boulder/boulder.entity';

export class RemoveJudgeAssignmentToBoulderParamsDto {
  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly groupId!: typeof BoulderingGroup.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly boulderId!: typeof Boulder.prototype.id;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;
}
