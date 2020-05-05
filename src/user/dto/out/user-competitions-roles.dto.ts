import { CompetitionDto } from '../../../competition/dto/out/competition.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserCompetitionsRolesDto {
  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly organizations!: CompetitionDto[];

  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly juryPresidencies!: CompetitionDto[];

  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly judgements!: CompetitionDto[];

  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly chiefRouteSettings!: CompetitionDto[];

  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly routeSettings!: CompetitionDto[];

  @ApiProperty({
    isArray: true,
    type: CompetitionDto,
  })
  readonly technicalDelegations!: CompetitionDto[];
}
