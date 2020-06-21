import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism, StrictSchema } from 'morphism';
import { BoulderingRoundRankingType } from '../../bouldering/round/bouldering-round.entity';

import {
  BoulderingGroupRankingsDto,
  CircuitGroupRankingsDto,
  LimitedContestGroupRankingsDto,
  RankingsDataDto,
  UnlimitedContestGroupRankingsDto,
} from '../../bouldering/dto/out/bouldering-group-rankings.dto';

import {
  BoulderingCircuitRankings,
  BoulderingGroupRankings,
  BoulderingLimitedContestRankings,
  BoulderingUnlimitedContestRankings,
} from '../../bouldering/group/bouldering-group.entity';

import { ClimberRankingInfosMapper } from './climber-ranking-infos.mapper';
import { BoulderingUnlimitedContestRankingMapper } from './bouldering-unlimited-contest-ranking.mapper';
import { BoulderingLimitedContestRankingMapper } from './bouldering-limited-contest-ranking.mapper';
import { BoulderingCircuitRankingMapper } from './bouldering-circuit-ranking.mapper';

@Injectable()
export class BoulderingGroupRankingsMapper extends BaseMapper<
  BoulderingGroupRankingsDto,
  BoulderingGroupRankings
> {
  constructor(
    private readonly climberRankingInfosMapper: ClimberRankingInfosMapper,
    private readonly boulderingUnlimitedContestRankingMapper: BoulderingUnlimitedContestRankingMapper,
    private readonly boulderingLimitedContestRankingMapper: BoulderingLimitedContestRankingMapper,
    private readonly boulderingCircuitRankingMapper: BoulderingCircuitRankingMapper,
  ) {
    super({
      type: 'type',
      data: (group): RankingsDataDto => {
        if (group.type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
          return this.mapUnlimitedContest(group);
        }

        if (group.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
          return this.mapLimitedContest(group);
        }

        if (group.type === BoulderingRoundRankingType.CIRCUIT) {
          return this.mapCircuit(group);
        }

        throw new NotImplementedException('Unhandled ranking type');
      },
    });
  }

  private readonly unlimitedContestGroupRankingsSchema: StrictSchema<
    UnlimitedContestGroupRankingsDto,
    BoulderingUnlimitedContestRankings
  > = {
    type: 'type',
    bouldersPoints: 'bouldersPoints',
    boulders: 'boulders',
    rankings: (unlimitedContestRankings) =>
      this.boulderingUnlimitedContestRankingMapper.mapArray(
        unlimitedContestRankings.rankings,
      ),
  };

  private mapUnlimitedContest(
    unlimitedContest: BoulderingUnlimitedContestRankings,
  ): UnlimitedContestGroupRankingsDto {
    return morphism(this.unlimitedContestGroupRankingsSchema, unlimitedContest);
  }

  private readonly limitedContestGroupRankingsSchema: StrictSchema<
    LimitedContestGroupRankingsDto,
    BoulderingLimitedContestRankings
  > = {
    type: 'type',
    boulders: 'boulders',
    rankings: (unlimitedContestRankings) =>
      this.boulderingLimitedContestRankingMapper.mapArray(
        unlimitedContestRankings.rankings,
      ),
  };

  private mapLimitedContest(
    limitedContest: BoulderingLimitedContestRankings,
  ): LimitedContestGroupRankingsDto {
    return morphism(this.limitedContestGroupRankingsSchema, limitedContest);
  }

  private readonly circuitGroupRankingsSchema: StrictSchema<
    CircuitGroupRankingsDto,
    BoulderingCircuitRankings
  > = {
    type: 'type',
    boulders: 'boulders',
    rankings: (circuitRankings) =>
      this.boulderingCircuitRankingMapper.mapArray(circuitRankings.rankings),
  };

  private mapCircuit(
    circuit: BoulderingCircuitRankings,
  ): CircuitGroupRankingsDto {
    return morphism(this.circuitGroupRankingsSchema, circuit);
  }

  public map(rankings: BoulderingGroupRankings): BoulderingGroupRankingsDto {
    return morphism(this.schema, rankings);
  }

  public mapArray(
    rankings: BoulderingGroupRankings[],
  ): BoulderingGroupRankingsDto[] {
    return rankings.map((r) => this.map(r));
  }
}
