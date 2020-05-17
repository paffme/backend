import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { JudgementAssignmentDto } from '../../user/dto/out/judgement-assignment.dto';
import { JudgementAssignment } from '../../user/interfaces/judgement-assignement.type';
import { CompetitionType } from '../../competition/types/competition-type.enum';
import { Boulder } from '../../bouldering/boulder/boulder.entity';
import { Competition } from '../../competition/competition.entity';
import { BoulderingRound } from '../../bouldering/round/bouldering-round.entity';
import { BoulderingGroup } from '../../bouldering/group/bouldering-group.entity';

@Injectable()
export class JudgementAssignmentsMapper extends BaseMapper<
  JudgementAssignmentDto,
  JudgementAssignment
> {
  constructor() {
    super({
      competitionId(
        assignment: JudgementAssignment,
      ): typeof Competition.prototype.id {
        return assignment.group.round.competition.id;
      },
      roundId(
        assignment: JudgementAssignment,
      ): typeof BoulderingRound.prototype.id {
        return assignment.group.round.id;
      },
      groupId(
        assignment: JudgementAssignment,
      ): typeof BoulderingGroup.prototype.id {
        return assignment.group.id;
      },
      type(assignment: JudgementAssignment): CompetitionType {
        if (assignment instanceof Boulder) {
          return CompetitionType.Bouldering;
        }

        throw new NotImplementedException();
      },
      assignedElementId(assignment: JudgementAssignment): typeof assignment.id {
        return assignment.id;
      },
    });
  }

  public map(judgementAssignment: JudgementAssignment): JudgementAssignmentDto {
    return morphism(this.schema, judgementAssignment);
  }

  public mapArray(
    judgementAssignments: JudgementAssignment[],
  ): JudgementAssignmentDto[] {
    return judgementAssignments.map((j) => this.map(j));
  }
}
