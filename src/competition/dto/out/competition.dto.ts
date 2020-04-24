import { ApiProperty } from '@nestjs/swagger';
import { BaseDtoWithID } from '../../../shared/base.dto';
import { Sex } from '../../../shared/types/sex.enum';
import { CategoryName } from '../../../shared/types/category-name.enum';
import { CompetitionType } from '../../types/competition-type.enum';

class CategoryDto {
  @ApiProperty({
    enum: Sex,
  })
  sex!: Sex;

  @ApiProperty({
    enum: CategoryName,
  })
  name!: CategoryName;
}

export class CompetitionDto extends BaseDtoWithID {
  @ApiProperty()
  name!: string;

  @ApiProperty({
    enum: CompetitionType,
  })
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

  @ApiProperty({
    type: CategoryDto,
    isArray: true,
  })
  categories!: CategoryDto[];
}
