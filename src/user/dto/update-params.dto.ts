import { IsInt } from 'class-validator';
import { User } from '../user.entity';

export class UpdateParamsDto {
  @IsInt()
  readonly userId: typeof User.prototype.id;
}
