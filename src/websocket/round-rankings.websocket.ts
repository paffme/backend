import { WebSocketGateway } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { BaseWebsocket } from './base.websocket';
import { BoulderingRoundService } from '../bouldering/round/bouldering-round.service';
import { RoundRankingsUpdateEventDto } from './dto/out/round-rankings-update-event.dto';

enum RoundRankingsEvents {
  RANKINGS_UPDATE = 'rankingsUpdate',
}

@WebSocketGateway({ namespace: 'round-rankings' })
export class RoundRankingsWebsocket extends BaseWebsocket {
  constructor(private readonly boulderingRoundService: BoulderingRoundService) {
    super(new Logger(RoundRankingsWebsocket.name));

    boulderingRoundService.on('rankingsUpdate', (eventPayload) => {
      this.server
        .to(this.getRoom(eventPayload.roundId))
        .emit(
          RoundRankingsEvents.RANKINGS_UPDATE,
          new RoundRankingsUpdateEventDto(eventPayload),
        );
    });
  }
}
