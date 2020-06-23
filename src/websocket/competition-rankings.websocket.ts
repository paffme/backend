import { WebSocketGateway } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { BaseWebsocket } from './base.websocket';
import { CompetitionService } from '../competition/competition.service';
import { CompetitionRankingsUpdateEventDto } from './dto/out/competition-rankings-update-event.dto';

enum CompetitionRankingsEvents {
  RANKINGS_UPDATE = 'rankingsUpdate',
}

@WebSocketGateway({ namespace: 'competition-rankings' })
export class CompetitionRankingsWebsocket extends BaseWebsocket {
  constructor(private readonly competitionService: CompetitionService) {
    super(new Logger(CompetitionRankingsWebsocket.name));

    competitionService.on('rankingsUpdate', (eventPayload) => {
      this.server
        .to(this.getRoom(eventPayload.competitionId))
        .emit(
          CompetitionRankingsEvents.RANKINGS_UPDATE,
          new CompetitionRankingsUpdateEventDto(eventPayload),
        );
    });
  }
}
