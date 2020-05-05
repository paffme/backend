import { ApiProperty } from '@nestjs/swagger';

export class UserCompetitionRolesDto {
  @ApiProperty()
  readonly organizer!: boolean;

  @ApiProperty()
  readonly juryPresident!: boolean;

  @ApiProperty()
  readonly judge!: boolean;

  @ApiProperty()
  readonly chiefRouteSetter!: boolean;

  @ApiProperty()
  readonly routeSetter!: boolean;

  @ApiProperty()
  readonly technicalDelegate!: boolean;
}
