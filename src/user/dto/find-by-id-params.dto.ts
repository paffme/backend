import { IsInt } from 'class-validator';
import { User } from '../user.entity';

export class FindByIdParamsDto {
  @IsInt()
  readonly userId: typeof User.prototype.id;
}
