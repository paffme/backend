import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { BoulderingResult } from './bouldering-result.entity';
import { BoulderingRound } from './bouldering-round.entity';
import { BoulderingService } from './bouldering.service';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [BoulderingResult, BoulderingRound],
    }),
  ],
  controllers: [],
  providers: [BoulderingService],
  exports: [BoulderingService],
})
export class BoulderingModule {}
