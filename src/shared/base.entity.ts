import { IdEntity, PrimaryKey, Property } from 'mikro-orm';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class BaseEntity<T> implements IdEntity<BaseEntity<T>> {
  @PrimaryKey()
  @ApiModelProperty()
  id!: number;

  @Property()
  @ApiModelProperty({ type: String, format: 'date-time' })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  @ApiModelProperty({ type: String, format: 'date-time' })
  updatedAt = new Date();
}
