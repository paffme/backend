import { ApiProperty } from '@nestjs/swagger';

export class CountDto {
  @ApiProperty()
  readonly count!: number;
}
