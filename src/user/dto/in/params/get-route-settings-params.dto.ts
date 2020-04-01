import { IsInt } from 'class-validator';
import { User } from '../../../user.entity';
import { Type } from 'class-transformer';

export class GetRouteSettingsParamsDto {
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;
}
