import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { Competition } from './competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { UserModule } from '../user/user.module';
import { CompetitionRegistration } from '../shared/entity/competition-registration.entity';
import { OrganizerAuthorizationService } from './authorization/organizer.authorization.service';
import { BoulderingModule } from '../bouldering/bouldering.module';
import { JuryPresidentAuthorizationService } from './authorization/jury-president.authorization.service';
import { JudgeAuthorizationService } from './authorization/judge.authorization.service';
import { OrganizerAuthorizationGuard } from './authorization/organizer.authorization.guard';
import { JuryPresidentAuthorizationGuard } from './authorization/jury-president.authorization.guard';
import { ChiefRouteSetterAuthorizationGuard } from './authorization/chief-route-setter.authorization.guard';
import { ChiefRouteSetterAuthorizationService } from './authorization/chief-route-setter.authorization.service';
import { JudgeAuthorizationGuard } from './authorization/judge.authorization.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [Competition, CompetitionRegistration],
    }),
    UserModule,
    BoulderingModule,
  ],
  controllers: [CompetitionController],
  providers: [
    OrganizerAuthorizationGuard,
    JuryPresidentAuthorizationGuard,
    ChiefRouteSetterAuthorizationGuard,
    JudgeAuthorizationGuard,
    CompetitionService,
    OrganizerAuthorizationService,
    JuryPresidentAuthorizationService,
    JudgeAuthorizationService,
    ChiefRouteSetterAuthorizationService,
  ],
})
export class CompetitionModule {}
