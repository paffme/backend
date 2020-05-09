import { ApiProperty } from '@nestjs/swagger';

export class CountUsersDto {
  @ApiProperty()
  readonly count!: number;
}
