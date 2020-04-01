import { Global, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthenticationService } from './auth/authentication.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ConfigurationService } from './configuration/configuration.service';
import { UserMapper } from './mappers/user.mapper';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CompetitionMapper } from './mappers/competition.mapper';
import { CompetitionRegistrationMapper } from './mappers/competition-registration.mapper';

@Global()
@Module({
  providers: [
    ConfigurationService,
    AuthenticationService,
    JwtStrategy,
    UserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
  ],
  exports: [
    ConfigurationService,
    AuthenticationService,
    UserMapper,
    CompetitionMapper,
    CompetitionRegistrationMapper,
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
