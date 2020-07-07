import { WebSocketGateway } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { BaseWebsocket } from './base.websocket';
import { BoulderService } from '../bouldering/boulder/boulder.service';
import { HoldsRecognitionDoneEventDto } from './dto/out/holds-recognition-done-event.dto';

enum BoulderEvents {
  HOLDS_RECOGNITION_DONE = 'holdsRecognitionDone',
}

@WebSocketGateway({ namespace: 'boulders' })
export class BoulderWebsocket extends BaseWebsocket {
  constructor(private readonly boulderService: BoulderService) {
    super(new Logger(BoulderWebsocket.name));

    boulderService.on('holdsRecognitionDone', (eventPayload) => {
      this.server
        .to(this.getRoom(eventPayload.boulderId))
        .emit(
          BoulderEvents.HOLDS_RECOGNITION_DONE,
          new HoldsRecognitionDoneEventDto(eventPayload),
        );
    });
  }
}
