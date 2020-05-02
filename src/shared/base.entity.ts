import { PrimaryKey, PrimaryKeyType, Property } from 'mikro-orm';

export abstract class BaseEntity {
  [PrimaryKeyType]: number;

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();
}
