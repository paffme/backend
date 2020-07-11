import { WebSocketGateway } from '@nestjs/websockets';
import { BaseWebsocket } from './base.websocket';
import { BoulderingRoundService } from '../bouldering/round/bouldering-round.service';
import { RoundRankingsUpdateEventDto } from './dto/out/round-rankings-update-event.dto';
import { Logger } from 'nestjs-pino';

enum RoundRankingsEvents {
  RANKINGS_UPDATE = 'rankingsUpdate',
}

@WebSocketGateway({ namespace: 'round-rankings' })
export class RoundRankingsWebsocket extends BaseWebsocket {
  constructor(
    private readonly boulderingRoundService: BoulderingRoundService,
    logger: Logger,
  ) {
    super(logger);

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
