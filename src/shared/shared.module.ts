import { Global, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ConfigurationService } from './configuration/configuration.service';
import { UserMapper } from './mappers/user.mapper';

@Global()
@Module({
  providers: [ConfigurationService, AuthService, JwtStrategy, UserMapper],
  exports: [ConfigurationService, AuthService, UserMapper],
  imports: [UserModule],
})
export class SharedModule {}
