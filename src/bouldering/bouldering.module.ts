import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { BoulderingResult } from './result/bouldering-result.entity';
import { BoulderingRound } from './round/bouldering-round.entity';
import { BoulderingRoundService } from './round/bouldering-round.service';
import { BoulderingResultService } from './result/bouldering-result.service';
import { BoulderService } from './boulder/boulder.service';
import { Boulder } from './boulder/boulder.entity';
import { BoulderingRoundUnlimitedContestRankingService } from './round/ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from './round/ranking/bouldering-round-counted-ranking.service';
import { BoulderingRankingService } from './ranking/bouldering-ranking.service';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [BoulderingResult, BoulderingRound, Boulder],
    }),
  ],
  controllers: [],
  providers: [
    BoulderingRoundService,
    BoulderingResultService,
    BoulderService,
    BoulderingRoundUnlimitedContestRankingService,
    BoulderingRoundCountedRankingService,
    BoulderingRankingService,
  ],
  exports: [
    BoulderingRoundService,
    BoulderingResultService,
    BoulderService,
    BoulderingRankingService,
  ],
})
export class BoulderingModule {}
