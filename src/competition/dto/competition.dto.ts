import { ApiProperty } from '@nestjs/swagger';
import { BaseDtoWithID } from '../../shared/base.dto';
import { Category, CompetitionType } from '../competition.entity';

export class CompetitionDto extends BaseDtoWithID {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: CompetitionType;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  categories: Category[];
}
