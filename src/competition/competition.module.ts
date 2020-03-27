import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { Competition } from './competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Competition] })],
  controllers: [CompetitionController],
  providers: [CompetitionService],
})
export class CompetitionModule {}
