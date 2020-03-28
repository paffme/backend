import { BaseMapper } from './mappers/base.mapper';
import { EventEmitter } from 'events';

export abstract class BaseService<T, K> extends EventEmitter {
  protected constructor(public entity: T, public mapper: BaseMapper<K, T>) {
    super();
  }
}
