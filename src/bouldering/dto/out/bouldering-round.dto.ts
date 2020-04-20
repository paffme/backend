import { ApiProperty } from '@nestjs/swagger';
import {
  BoulderingRound,
  BoulderingRoundRankingType,
} from '../../round/bouldering-round.entity';
import { BoulderDto } from './boulder.dto';
import { Competition } from '../../../competition/competition.entity';

export class BoulderingRoundDto {
  @ApiProperty({
    type: Number,
  })
  id!: typeof BoulderingRound.prototype.id;

  @ApiProperty({
    type: Number,
  })
  competitionId!: typeof Competition.prototype.id;

  @ApiProperty({
    type: Number,
  })
  name!: typeof BoulderingRound.prototype.name;

  @ApiProperty({
    type: Number,
  })
  index!: typeof BoulderingRound.prototype.index;

  @ApiProperty({
    type: Number,
  })
  quota!: typeof BoulderingRound.prototype.quota;

  @ApiProperty({ enum: BoulderingRoundRankingType })
  type!: typeof BoulderingRound.prototype.type;

  @ApiProperty({ isArray: true, type: BoulderDto })
  boulders!: BoulderDto[];
}
