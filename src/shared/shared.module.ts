import { Global, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthenticationService } from './authentication/authentication.service';
import { JwtStrategy } from './authentication/strategies/jwt.strategy';
import { ConfigurationService } from './configuration/configuration.service';
import { UserMapper } from './mappers/user.mapper';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CompetitionMapper } from './mappers/competition.mapper';
import { CompetitionRegistrationMapper } from './mappers/competition-registration.mapper';
import { UserAuthorizationService } from './authorization/user.authorization.service';
import { BoulderingRoundMapper } from './mappers/bouldering-round.mapper';
import { BoulderingResultMapper } from './mappers/bouldering-result.mapper';
import { BoulderMapper } from './mappers/boulder.mapper';
import { RankingsMapper } from './mappers/rankings.mapper';
import { BoulderingGroupMapper } from './mappers/bouldering-group.mapper';
import { PaginationService } from './pagination/pagination.service';
import { LimitedUserMapper } from './mappers/limited-user.mapper';
import { BoulderingRoundRankingsMapper } from './mappers/bouldering-round-rankings.mapper';
import { BoulderingLimitedRoundMapper } from './mappers/bouldering-limited-round.mapper';

import {
  BoulderingRoundsByCategoryByTypeMapper,
  RoundBySexMapper,
  RoundByTypeMapper,
} from './mappers/bouldering-rounds-by-category-by-type.mapper';
import { JudgementAssignmentsMapper } from './mappers/judgement-assignments.mapper';

@Global()
@Module({
  providers: [
    ConfigurationService,
    AuthenticationService,
    JwtStrategy,
    UserMapper,
    LimitedUserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
    BoulderingRoundMapper,
    BoulderingResultMapper,
    BoulderMapper,
    RankingsMapper,
    BoulderingGroupMapper,
    BoulderingRoundRankingsMapper,
    BoulderingLimitedRoundMapper,
    BoulderingRoundsByCategoryByTypeMapper,
    RoundBySexMapper,
    RoundByTypeMapper,
    JudgementAssignmentsMapper,
    UserAuthorizationService,
    PaginationService,
  ],
  exports: [
    ConfigurationService,
    AuthenticationService,
    UserMapper,
    LimitedUserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
    BoulderingRoundMapper,
    BoulderingResultMapper,
    BoulderMapper,
    RankingsMapper,
    BoulderingGroupMapper,
    BoulderingRoundRankingsMapper,
    BoulderingLimitedRoundMapper,
    BoulderingRoundsByCategoryByTypeMapper,
    RoundBySexMapper,
    RoundByTypeMapper,
    JudgementAssignmentsMapper,
    UserAuthorizationService,
    PaginationService,
  ],
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigurationService],
      useFactory(configurationService: ConfigurationService) {
        return {
          secret: configurationService.get('JWT_SECRET'),
        };
      },
    }),
  ],
})
export class SharedModule {}
