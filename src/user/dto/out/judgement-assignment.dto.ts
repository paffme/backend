import { Competition } from '../../../competition/competition.entity';
import { BoulderingRound } from '../../../bouldering/round/bouldering-round.entity';
import { BoulderingGroup } from '../../../bouldering/group/bouldering-group.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CompetitionType } from '../../../competition/types/competition-type.enum';

export class JudgementAssignmentDto {
  @ApiProperty({ enum: CompetitionType })
  readonly type!: CompetitionType;

  @ApiProperty({ type: Number })
  readonly competitionId!: typeof Competition.prototype.id;

  @ApiProperty({ type: Number })
  readonly roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty({ type: Number })
  readonly groupId!: typeof BoulderingGroup.prototype.id;

  @ApiProperty()
  readonly assignedElementId!: number;
}
