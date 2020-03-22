import { BaseMapper } from './mappers/base.mapper';
import { BaseEntity } from './base.entity';
import { EventEmitter } from 'events';
import { BaseDto } from './base.dto';

export abstract class BaseService<
  T extends BaseEntity<T>,
  K extends BaseDto
> extends EventEmitter {
  protected constructor(public entity: T, public mapper: BaseMapper<K, T>) {
    super();
  }
}
