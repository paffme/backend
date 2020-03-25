import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../../shared/base.dto';
import { Category, CompetitionType } from '../competition.entity';

export class CompetitionDto extends BaseDto {
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
