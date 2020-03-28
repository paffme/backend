import { ApiModelProperty } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseDto {
  @ApiModelProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiModelProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class BaseDtoWithID extends BaseDto {
  @ApiPropertyOptional() id: number;
}
