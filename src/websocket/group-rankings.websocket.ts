import { WebSocketGateway } from '@nestjs/websockets';

import { Logger } from '@nestjs/common';
import { BoulderingGroupService } from '../bouldering/group/bouldering-group.service';
import { BaseWebsocket } from './base.websocket';
import { GroupRankingsUpdateEventDto } from './dto/out/group-rankings-update-event.dto';

enum GroupRankingsEvents {
  RANKINGS_UPDATE = 'rankingsUpdate',
}

@WebSocketGateway({ namespace: 'group-rankings' })
export class GroupRankingsWebsocket extends BaseWebsocket {
  constructor(private readonly boulderingGroupService: BoulderingGroupService) {
    super(new Logger(GroupRankingsWebsocket.name));

    boulderingGroupService.on('rankingsUpdate', (eventPayload) => {
      this.server
        .to(this.getRoom(eventPayload.groupId))
        .emit(
          GroupRankingsEvents.RANKINGS_UPDATE,
          new GroupRankingsUpdateEventDto(eventPayload),
        );
    });
  }
}
