import config from './mikro-orm.config';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from 'nestjs-mikro-orm';

import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { ConfigurationService } from './shared/configuration/configuration.service';
import { SharedModule } from './shared/shared.module';
import { AppService } from './app.service';
import { CompetitionModule } from './competition/competition.module';
import { WebsocketModule } from './websocket/websocket.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  controllers: [AppController],
  imports: [
    MikroOrmModule.forRoot(config),
    SharedModule,
    UserModule,
    CompetitionModule,
    WebsocketModule,
    LoggerModule.forRoot(),
  ],
  providers: [AppService],
})
export class AppModule {
  static host: string;
  static port: number;
  static url: string;
  static isDev: boolean;

  constructor(private readonly configurationService: ConfigurationService) {
    AppModule.port = configurationService.get('PORT');
    AppModule.host = configurationService.get('HOST');
    AppModule.url = configurationService.get('BASE_API_URL');
    AppModule.isDev = configurationService.isDevelopment;
  }
}
