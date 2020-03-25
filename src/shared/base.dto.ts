import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export class BaseDto {
  @ApiModelProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiModelProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiModelProperty() id: number;
}
