import { BaseMapper } from './mappers/base.mapper';
import { EventEmitter } from 'events';
import { User } from '../user/user.entity';

export abstract class BaseService<T, K> extends EventEmitter {
  protected constructor(public entity: T, public mapper: BaseMapper<K, T>) {
    super();
  }

  abstract getOwner(entityId: unknown): Promise<User | null>;
}
