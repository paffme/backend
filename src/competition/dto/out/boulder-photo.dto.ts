import { ApiProperty } from '@nestjs/swagger';

export class BoulderPhotoDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;
}
