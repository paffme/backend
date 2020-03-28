import { StrictSchema } from 'morphism';

export abstract class BaseMapper<T, K> {
  protected constructor(protected schema?: StrictSchema<T, K>) {}
  public abstract map(input: K): T;
  public abstract mapArray(input: K[]): T[];
}
