import { Property } from 'mikro-orm';
import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export abstract class Timestamp {
  @Property()
  @ApiModelProperty({ type: String, format: 'date-time' })
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  @ApiModelProperty({ type: String, format: 'date-time' })
  updatedAt = new Date();
}
