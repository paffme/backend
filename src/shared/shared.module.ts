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
import { RankingMapper } from './mappers/ranking.mapper';

@Global()
@Module({
  providers: [
    ConfigurationService,
    AuthenticationService,
    JwtStrategy,
    UserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
    BoulderingRoundMapper,
    BoulderingResultMapper,
    BoulderMapper,
    RankingMapper,
    UserAuthorizationService,
  ],
  exports: [
    ConfigurationService,
    AuthenticationService,
    UserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
    BoulderingRoundMapper,
    BoulderingResultMapper,
    BoulderMapper,
    RankingMapper,
    UserAuthorizationService,
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
