import { BoulderingRoundRankingType } from '../../round/bouldering-round.entity';
import {
  BoulderingGroup,
  BoulderingLimitedContestRankings,
} from '../bouldering-group.entity';
import { BoulderingGroupRankingService } from './bouldering-group-ranking.service';
import { BoulderingGroupCircuitRankingService } from './bouldering-group-circuit-ranking.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BoulderingGroupLimitedContestRankingService
  implements BoulderingGroupRankingService {
  constructor(
    private readonly boulderingGroupCircuitRankingService: BoulderingGroupCircuitRankingService,
  ) {}

  getRankings(group: BoulderingGroup): BoulderingLimitedContestRankings {
    const circuitRankings = this.boulderingGroupCircuitRankingService.getRankings(
      group,
    );

    return {
      type: BoulderingRoundRankingType.LIMITED_CONTEST,
      rankings: circuitRankings.rankings,
    };
  }
}
