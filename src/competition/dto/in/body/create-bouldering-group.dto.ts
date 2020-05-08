import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateBoulderingGroupDto {
  @ApiProperty()
  @IsString()
  @Length(1, 32)
  name!: string;
}
