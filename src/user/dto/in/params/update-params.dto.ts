import { IsInt } from 'class-validator';
import { User } from '../../../user.entity';
import { Type } from 'class-transformer';

export class UpdateParamsDto {
  @Type(() => Number)
  @IsInt()
  readonly userId!: typeof User.prototype.id;
}
