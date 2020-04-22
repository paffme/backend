import { Injectable } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import { BoulderingResultDto } from '../../bouldering/dto/out/bouldering-result.dto';
import { BoulderingResult } from '../../bouldering/result/bouldering-result.entity';

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
        result.round.isRankingWithCountedTries()
          ? result.topInTries
          : undefined,
      zone: (result) =>
        result.round.isRankingWithCountedZones() ? result.zone : undefined,
      zoneInTries: (result) =>
        result.round.isRankingWithCountedZones()
          ? result.zoneInTries
          : undefined,
      tries: (result) =>
        result.round.isRankingWithCountedTries() ? result.tries : undefined,
    });
  }

  public map(result: BoulderingResult): BoulderingResultDto {
    return morphism(this.schema, result);
  }

  public mapArray(results: BoulderingResult[]): BoulderingResultDto[] {
    return results.map((r) => this.map(r));
  }
}
