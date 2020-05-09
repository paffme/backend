import { IsOptional, ValidateNested } from 'class-validator';
import { SearchDto } from '../../../../shared/dto/search.dto';
import { Competition } from '../../../competition.entity';
import { Type } from 'class-transformer';

export class SearchCompetitionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchDto)
  startDate?: SearchDto<typeof Competition.prototype.startDate>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchDto)
  name?: SearchDto<typeof Competition.prototype.name>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchDto)
  city?: SearchDto<typeof Competition.prototype.city>;
}
