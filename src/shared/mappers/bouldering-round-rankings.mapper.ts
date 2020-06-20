import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import {
  BoulderingRoundRankings,
  BoulderingRoundRankingType,
} from '../../bouldering/round/bouldering-round.entity';
import {
  BoulderingRoundRankingsDto,
} from '../../bouldering/dto/out/bouldering-round-rankings.dto';
import { BoulderingGroupRankingsDto } from '../../bouldering/dto/out/bouldering-group-rankings.dto';
import {
  BoulderingCircuitRankings,
  BoulderingGroupRankings,
  BoulderingLimitedContestRankings,
  BoulderingUnlimitedContestRankings,
} from '../../bouldering/group/bouldering-group.entity';

@Injectable()
export class BoulderingRoundRankingsMapper extends BaseMapper<
  BoulderingRoundRankingsDto,
  BoulderingRoundRankings
> {
  constructor() {
    super({
      type: 'type',

    });
  }

  public mapGroupRankings(
    group: BoulderingGroupRankings,
    type: BoulderingRoundRankingType,
  ): BoulderingGroupRankingsDto {
    let groupRankings;

    if (type === BoulderingRoundRankingType.CIRCUIT) {
      groupRankings = this.mapCircuitGroupRankings(
        group as BoulderingCircuitRankings,
      );
    } else if (type === BoulderingRoundRankingType.LIMITED_CONTEST) {
      groupRankings = this.mapLimitedContestGroupRankings(
        group as BaseGroup<BoulderingLimitedContestRankings>,
      );
    } else if (type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
      groupRankings = this.mapUnlimitedContestGroupRankings(
        group as BaseGroup<BoulderingUnlimitedContestRankings>,
      );
    } else {
      throw new NotImplementedException('Unknown ranking type');
    }

    return {
      type,
      group: groupRankings,
    };
  }

  private mapCircuitGroupRankings(
    group: BaseGroup<BoulderingCircuitRankings>,
  ): CircuitGroupDto {
    return {
      id: group.id,
      rankings: group.rankings?.rankings.map((r) => ({
        climber: {
          id: r.climber.id,
          firstName: r.climber.firstName,
          lastName: r.climber.lastName,
          club: r.climber.club,
        },
        tops: r.tops,
        ranking: r.ranking,
        zonesInTries: r.zonesInTries,
        topsInTries: r.topsInTries,
        zones: r.zones,
      })),
    };
  }

  private mapLimitedContestGroupRankings(
    group: BaseGroup<BoulderingLimitedContestRankings>,
  ): LimitedContestGroupDto {
    return this.mapCircuitGroupRankings(group);
  }

  private mapUnlimitedContestGroupRankings(
    group: BaseGroup<BoulderingUnlimitedContestRankings>,
  ): UnlimitedContestGroupDto {
    return {
      id: group.id,
      bouldersPoints: group.rankings?.bouldersPoints,
      rankings: group.rankings?.rankings.map((r) => ({
        climber: {
          id: r.climber.id,
          firstName: r.climber.firstName,
          lastName: r.climber.lastName,
          club: r.climber.club,
        },
        ranking: r.ranking,
        nbTops: r.nbTops,
        points: r.points,
        tops: r.tops,
      })),
    };
  }

  public map(rankings: BoulderingRoundRankings): BoulderingRoundRankingsDto {
    return morphism(this.schema, rankings);
  }

  public mapArray(
    rankings: BoulderingRoundRankings[],
  ): BoulderingRoundRankingsDto[] {
    return rankings.map((r) => this.map(r));
  }
}
