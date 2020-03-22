import { BaseEntity } from '../base.entity';
import { StrictSchema } from 'morphism';
import { BaseDto } from '../base.dto';

export abstract class BaseMapper<T extends BaseDto, K extends BaseEntity<K>> {
  protected constructor(protected schema?: StrictSchema<T, K>) {}
  public abstract map(input: K): T;
  public abstract mapArray(input: K[]): T[];
}
