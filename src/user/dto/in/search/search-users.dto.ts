import { User } from '../../../user.entity';
import { IsOptional, IsString } from 'class-validator';

// For now this dto just handles equality
// but we could go much deeper by allowing
// to use MikroORM operators
// https://mikro-orm.io/docs/entity-manager/#conditions-object-filterqueryt
export class SearchUsersDto {
  @IsOptional()
  @IsString()
  firstName?: typeof User.prototype.firstName;

  @IsOptional()
  @IsString()
  lastName?: typeof User.prototype.firstName;
}
