import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { Competition } from './competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { UserModule } from '../user/user.module';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [Competition, CompetitionRegistration],
    }),
    UserModule,
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService],
})
export class CompetitionModule {}
