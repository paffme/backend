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
import { BoulderJudgeAuthorizationService } from './authorization/boulder-judge.authorization.service';
import { BoulderJudgeAuthorizationGuard } from './authorization/boulder-judge.authorization.guard';
import { Boulder } from '../bouldering/boulder/boulder.entity';
import { BoulderingController } from './bouldering.controller';
import { PdfModule } from '../pdf/pdf.module';
import { RouteSetterAuthorizationService } from './authorization/route-setter.authorization.service';
import { RouteSetterAuthorizationGuard } from './authorization/route-setter.authorization.guard';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [
        Competition,
        CompetitionRegistration,
        Boulder, // For authorization
      ],
    }),
    UserModule,
    BoulderingModule,
    PdfModule,
  ],
  controllers: [CompetitionController, BoulderingController],
  providers: [
    OrganizerAuthorizationGuard,
    JuryPresidentAuthorizationGuard,
    ChiefRouteSetterAuthorizationGuard,
    JudgeAuthorizationGuard,
    BoulderJudgeAuthorizationGuard,
    RouteSetterAuthorizationGuard,
    CompetitionService,
    OrganizerAuthorizationService,
    JuryPresidentAuthorizationService,
    JudgeAuthorizationService,
    ChiefRouteSetterAuthorizationService,
    BoulderJudgeAuthorizationService,
    RouteSetterAuthorizationService,
  ],
  exports: [CompetitionService],
})
export class CompetitionModule {}
