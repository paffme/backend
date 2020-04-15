import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingResultDto } from '../../bouldering/dto/out/bouldering-result.dto';
import { BoulderingResult } from '../../bouldering/bouldering-result.entity';
import { BoulderingRoundService } from '../../bouldering/bouldering-round.service';

@Injectable()
export class BoulderingResultMapper extends BaseMapper<
  BoulderingResultDto,
  BoulderingResult
> {
  constructor() {
    super({
      id: 'id',
      boulderId: (result) => result.boulder.id,
      climberId: (result) => result.climber.id,
      roundId: (result) => result.round.id,
      competitionId: (result) => result.round.competition.id,
      top: 'top',
      topInTries: (result) =>
        BoulderingRoundService.isRoundWithCountedTries(result.round)
          ? result.topInTries
          : undefined,
      zone: (result) =>
        BoulderingRoundService.isRoundWithCountedTries(result.round)
          ? result.zone
          : undefined,
      zoneInTries: (result) =>
        BoulderingRoundService.isRoundWithCountedTries(result.round)
          ? result.zoneInTries
          : undefined,
      tries: (result) =>
        BoulderingRoundService.isRoundWithCountedTries(result.round)
          ? result.tries
          : undefined,
    });
  }

  public map(result: BoulderingResult): BoulderingResultDto {
    return morphism(this.schema, result);
  }

  public mapArray(results: BoulderingResult[]): BoulderingResultDto[] {
    return results.map((r) => this.map(r));
  }
}
