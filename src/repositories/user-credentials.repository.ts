import {
  BelongsToAccessor,
  DefaultCrudRepository,
  Getter,
  repository,
} from '@loopback/repository';
import {User, UserCredentials, UserCredentialsRelations} from '../models';
import {inject} from '@loopback/core';
import {PostgreDataSource} from '../datasources';
import {UserRepository} from './user.repository';

export class UserCredentialsRepository extends DefaultCrudRepository<
  UserCredentials,
  typeof UserCredentials.prototype.id,
  UserCredentialsRelations
> {
  constructor(
    @inject('datasources.Postgre') dataSource: PostgreDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(UserCredentials, dataSource);
  }
}
