import { Module } from '@nestjs/common';
import { GroupRankingsWebsocket } from './group-rankings.websocket';
import { BoulderingModule } from '../bouldering/bouldering.module';
import { RoundRankingsWebsocket } from './round-rankings.websocket';
import { CompetitionRankingsWebsocket } from './competition-rankings.websocket';
import { CompetitionModule } from '../competition/competition.module';
import { BoulderWebsocket } from './boulder.websocket';

@Module({
  imports: [BoulderingModule, CompetitionModule],
  providers: [
    GroupRankingsWebsocket,
    RoundRankingsWebsocket,
    CompetitionRankingsWebsocket,
    BoulderWebsocket,
  ],
  exports: [],
})
export class WebsocketModule {}
