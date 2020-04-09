import { ApiProperty } from '@nestjs/swagger';
import { Category, CompetitionType } from '../../../competition.entity';

export class CreateCompetitionDTO {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: CompetitionType;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  postalCode!: string;

  @ApiProperty()
  categories!: Category[];
}
