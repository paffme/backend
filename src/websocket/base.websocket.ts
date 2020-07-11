import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger } from 'nestjs-pino';
import { JoinRoomDto } from './dto/in/join-room.dto';

export abstract class BaseWebsocket
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  protected readonly server!: Server;

  protected constructor(private readonly logger: Logger) {}

  protected getRoom(roomId: number): string {
    return `${roomId}`;
  }

  @SubscribeMessage('join')
  private join(socket: Socket, dto: JoinRoomDto): void {
    socket.join(this.getRoom(dto.roomId));
    this.logger.log(`${socket.id} joined ${dto.roomId} room`);
  }

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
