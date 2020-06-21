import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { BoulderingResult } from './result/bouldering-result.entity';
import { BoulderingRound } from './round/bouldering-round.entity';
import { BoulderingRoundService } from './round/bouldering-round.service';
import { BoulderingResultService } from './result/bouldering-result.service';
import { BoulderService } from './boulder/boulder.service';
import { Boulder } from './boulder/boulder.entity';
import { BoulderingRankingService } from './ranking/bouldering-ranking.service';
import { BoulderingGroup } from './group/bouldering-group.entity';
import { BoulderingGroupService } from './group/bouldering-group.service';
import { UserModule } from '../user/user.module';
import { BoulderingGroupLimitedContestRankingService } from './group/ranking/bouldering-group-limited-contest-ranking.service';
import { BoulderingGroupUnlimitedContestRankingService } from './group/ranking/bouldering-group-unlimited-contest-ranking.service';
import { BoulderingGroupCircuitRankingService } from './group/ranking/bouldering-group-circuit-ranking.service';

@Module({
  imports: [
    UserModule,
    MikroOrmModule.forFeature({
      entities: [BoulderingResult, BoulderingRound, Boulder, BoulderingGroup],
    }),
  ],
  controllers: [],
  providers: [
    BoulderingRoundService,
    BoulderingResultService,
    BoulderService,
    BoulderingGroupLimitedContestRankingService,
    BoulderingGroupUnlimitedContestRankingService,
    BoulderingGroupCircuitRankingService,
    BoulderingRankingService,
    BoulderingGroupService,
  ],
  exports: [
    BoulderingRoundService,
    BoulderingResultService,
    BoulderService,
    BoulderingRankingService,
  ],
})
export class BoulderingModule {}
