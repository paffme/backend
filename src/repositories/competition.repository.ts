import {DefaultCrudRepository} from '@loopback/repository';
import {Competition, CompetitionRelations} from '../models';
import {PostgreDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class CompetitionRepository extends DefaultCrudRepository<
  Competition,
  typeof Competition.prototype.id,
  CompetitionRelations
> {
  constructor(@inject('datasources.Postgre') dataSource: PostgreDataSource) {
    super(Competition, dataSource);
  }
}
