import { IsDateString, IsOptional, ValidateNested } from 'class-validator';

class StartDate {
  @IsOptional()
  @IsDateString()
  $gte?: Date;

  @IsOptional()
  @IsDateString()
  $lte?: Date;
}

export class SearchCompetitionsDto {
  @IsOptional()
  @ValidateNested()
  startDate?: StartDate;
}
