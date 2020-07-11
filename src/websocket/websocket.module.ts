import { Module } from '@nestjs/common';
import { GroupRankingsWebsocket } from './group-rankings.websocket';
import { BoulderingModule } from '../bouldering/bouldering.module';
import { RoundRankingsWebsocket } from './round-rankings.websocket';
import { CompetitionRankingsWebsocket } from './competition-rankings.websocket';
import { CompetitionModule } from '../competition/competition.module';
import { BoulderWebsocket } from './boulder.websocket';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [BoulderingModule, CompetitionModule, LoggerModule.forRoot()],
  providers: [
    GroupRankingsWebsocket,
    RoundRankingsWebsocket,
    CompetitionRankingsWebsocket,
    BoulderWebsocket,
  ],
  exports: [],
})
export class WebsocketModule {}
