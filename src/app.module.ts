import config from './mikro-orm.config';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';

import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { ConfigurationService } from './shared/configuration/configuration.service';
import { Configuration } from './shared/configuration/configuration.enum';
import { SharedModule } from './shared/shared.module';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  imports: [MikroOrmModule.forRoot(config), SharedModule, UserModule],
  providers: [AppService],
})
export class AppModule {
  static host: string;
  static port: number | string;
  static isDev: boolean;

  constructor(private readonly configurationService: ConfigurationService) {
    AppModule.port = AppModule.normalizePort(
      configurationService.get(Configuration.PORT),
    );
    AppModule.host = configurationService.get(Configuration.HOST);
    AppModule.isDev = configurationService.isDevelopment;
  }

  private static normalizePort(param: number | string): number | string {
    const portNumber: number =
      typeof param === 'string' ? parseInt(param, 10) : param;

    if (isNaN(portNumber)) {
      return param;
    } else if (portNumber >= 0) {
      return portNumber;
    }
  }
}
