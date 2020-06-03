import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../user/user.entity';
import { BoulderDto } from './boulder.dto';
import { BoulderingRound } from '../../round/bouldering-round.entity';
import {
  BoulderingGroup,
  BoulderingGroupState,
} from '../../group/bouldering-group.entity';

export class BoulderingGroupDto {
  @ApiProperty()
  readonly id!: typeof BoulderingGroup.prototype.id;

  @ApiProperty()
  readonly name!: string;

  @ApiProperty({
    isArray: true,
    type: Number,
  })
  readonly climbers!: typeof User.prototype.id[];

  @ApiProperty({
    isArray: true,
    type: BoulderDto,
  })
  readonly boulders!: BoulderDto[];

  @ApiProperty({
    type: Number,
  })
  readonly roundId!: typeof BoulderingRound.prototype.id;

  @ApiProperty({
    enum: BoulderingGroupState,
  })
  readonly state!: BoulderingGroupState;
}
