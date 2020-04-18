import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { BoulderingResult } from './bouldering-result.entity';
import { BoulderingRound } from './bouldering-round.entity';
import { BoulderingRoundService } from './bouldering-round.service';
import { BoulderingResultService } from './bouldering-result.service';
import { BoulderService } from './boulder.service';
import { Boulder } from './boulder.entity';
import { BoulderingUnlimitedContestRankingService } from './bouldering-unlimited-contest-ranking.service';

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
    BoulderingUnlimitedContestRankingService,
  ],
  exports: [BoulderingRoundService, BoulderingResultService, BoulderService],
})
export class BoulderingModule {}
