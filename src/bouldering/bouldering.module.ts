import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { BoulderingResult } from './result/bouldering-result.entity';
import { BoulderingRound } from './round/bouldering-round.entity';
import { BoulderingRoundService } from './round/bouldering-round.service';
import { BoulderingResultService } from './result/bouldering-result.service';
import { BoulderService } from './boulder/boulder.service';
import { Boulder } from './boulder/boulder.entity';
import { BoulderingRoundUnlimitedContestRankingService } from './ranking/bouldering-round-unlimited-contest-ranking.service';
import { BoulderingRoundCountedRankingService } from './ranking/bouldering-round-counted-ranking.service';

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
  ],
  exports: [BoulderingRoundService, BoulderingResultService, BoulderService],
})
export class BoulderingModule {}
