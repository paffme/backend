import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionType } from '../../../types/competition-type.enum';
import { Sex } from '../../../../shared/types/sex.enum';
import { CategoryName } from '../../../../shared/types/category-name.enum';

class UpdateCategoryDto {
  @ApiPropertyOptional({
    enum: Sex,
  })
  sex?: Sex;

  @ApiPropertyOptional({
    enum: CategoryName,
  })
  name?: CategoryName;
}

export class UpdateCompetitionByIdDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({
    enum: CompetitionType,
  })
  type?: CompetitionType;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional({
    type: UpdateCategoryDto,
    isArray: true,
  })
  categories?: UpdateCategoryDto[];
}
