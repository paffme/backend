import { ApiProperty } from '@nestjs/swagger';

export class BoulderPhotoDto {
  @ApiProperty()
  url!: string;
}
