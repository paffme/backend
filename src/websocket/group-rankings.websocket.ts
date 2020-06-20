import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'group-rankings' })
export class GroupRankingsWebsocket
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GroupRankingsWebsocket.name);

  @WebSocketServer()
  private readonly server!: Server;

  afterInit(): void {
    this.logger.log('Rankings websocket ready');
  }

  handleConnection(socket: Socket): void {
    this.logger.log(
      `New connection ${socket.id} (${socket.conn.remoteAddress})`,
    );
  }

  handleDisconnect(socket: Socket): void {
    this.logger.log(`${socket.id} disconnected (${socket.conn.remoteAddress})`);
  }
}
