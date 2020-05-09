import { User } from '../../../user.entity';
import { IsOptional, ValidateNested } from 'class-validator';
import { SearchDto } from '../../../../shared/dto/search.dto';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchDto)
  firstName?: SearchDto<typeof User.prototype.firstName>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchDto)
  lastName?: SearchDto<typeof User.prototype.lastName>;
}
