import { Module } from '@nestjs/common';
import { GroupRankingsWebsocket } from './group-rankings.websocket';
import { BoulderingModule } from '../bouldering/bouldering.module';
import { RoundRankingsWebsocket } from './round-rankings.websocket';
import { CompetitionRankingsWebsocket } from './competition-rankings.websocket';
import { CompetitionModule } from '../competition/competition.module';

@Module({
  imports: [BoulderingModule, CompetitionModule],
  providers: [
    GroupRankingsWebsocket,
    RoundRankingsWebsocket,
    CompetitionRankingsWebsocket,
  ],
  exports: [],
})
export class WebsocketModule {}
