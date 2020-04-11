import { ApiProperty } from '@nestjs/swagger';

export class BoulderingRoundDto {
  @ApiProperty()
  name!: string;
}
