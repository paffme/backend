import { ApiProperty } from '@nestjs/swagger';
import {
  BoulderingRound,
  BoulderingRoundType,
} from '../../bouldering-round.entity';
import { BoulderDto } from './boulder.dto';
import { Competition } from '../../../competition/competition.entity';

export class BoulderingRoundDto {
  @ApiProperty()
  id!: typeof BoulderingRound.prototype.id;

  @ApiProperty()
  competitionId!: typeof Competition.prototype.id;

  @ApiProperty()
  name!: typeof BoulderingRound.prototype.name;

  @ApiProperty()
  index!: typeof BoulderingRound.prototype.index;

  @ApiProperty()
  quota!: typeof BoulderingRound.prototype.quota;

  @ApiProperty({ enum: BoulderingRoundType })
  type!: typeof BoulderingRound.prototype.type;

  @ApiProperty({ isArray: true, type: BoulderDto })
  boulders!: BoulderDto[];
}
