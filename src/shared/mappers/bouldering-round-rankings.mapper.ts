import { Injectable, NotImplementedException } from '@nestjs/common';
import { BaseMapper } from './base.mapper';
import { morphism } from 'morphism';
import {
  BaseGroup,
  BoulderingGroupRankings,
  BoulderingRoundCountedRanking,
  BoulderingRoundRankings,
  BoulderingRoundRankingType,
  BoulderingRoundUnlimitedContestGroup,
  BoulderingRoundUnlimitedContestRanking,
} from '../../bouldering/round/bouldering-round.entity';
import {
  BoulderingRoundRankingsDto,
  CircuitGroupDto,
  LimitedContestGroupDto,
  UnlimitedContestGroupDto,
} from '../../bouldering/dto/out/bouldering-round-rankings.dto';
import { BoulderingGroupRankingsDto } from '../../bouldering/dto/out/bouldering-group-rankings.dto';

@Injectable()
export class BoulderingRoundRankingsMapper extends BaseMapper<
  BoulderingRoundRankingsDto,
  BoulderingRoundRankings
> {
  constructor() {
    super({
      type: 'type',
      groups: (rankings) => {
        if (rankings.type === BoulderingRoundRankingType.CIRCUIT) {
          return rankings.groups.map(this.mapCircuitGroupRankings);
        }

        if (rankings.type === BoulderingRoundRankingType.LIMITED_CONTEST) {
          return rankings.groups.map(this.mapLimitedContestGroupRankings);
        }

        if (rankings.type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
          return rankings.groups.map(this.mapUnlimitedContestGroupRankings);
        }

        throw new NotImplementedException('Unknown ranking type');
      },
    });
  }

  public mapGroup(
    group: BoulderingGroupRankings,
    type: BoulderingRoundRankingType,
  ): BoulderingGroupRankingsDto {
    let groupRankings;

    if (type === BoulderingRoundRankingType.CIRCUIT) {
      groupRankings = this.mapCircuitGroupRankings(
        group as BaseGroup<BoulderingRoundCountedRanking>,
      );
    } else if (type === BoulderingRoundRankingType.LIMITED_CONTEST) {
      groupRankings = this.mapLimitedContestGroupRankings(
        group as BaseGroup<BoulderingRoundCountedRanking>,
      );
    } else if (type === BoulderingRoundRankingType.UNLIMITED_CONTEST) {
      groupRankings = this.mapUnlimitedContestGroupRankings(
        group as BoulderingRoundUnlimitedContestGroup<
          BoulderingRoundUnlimitedContestRanking
        >,
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
    group: BaseGroup<BoulderingRoundCountedRanking>,
  ): CircuitGroupDto {
    return {
      id: group.id,
      rankings: group.rankings.map((r) => ({
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
    group: BaseGroup<BoulderingRoundCountedRanking>,
  ): LimitedContestGroupDto {
    return this.mapCircuitGroupRankings(group);
  }

  private mapUnlimitedContestGroupRankings(
    group: BoulderingRoundUnlimitedContestGroup<
      BoulderingRoundUnlimitedContestRanking
    >,
  ): UnlimitedContestGroupDto {
    return {
      id: group.id,
      bouldersPoints: group.bouldersPoints,
      rankings: group.rankings.map((r) => ({
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
