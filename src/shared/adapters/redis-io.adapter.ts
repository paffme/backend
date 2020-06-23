import { IoAdapter } from '@nestjs/platform-socket.io';
import redisIoAdapter, { SocketIORedisOptions } from 'socket.io-redis';
import { ConfigurationService } from '../configuration/configuration.service';

const configService = new ConfigurationService();

const redisOptions: SocketIORedisOptions = {
  host: configService.get('REDIS_HOST'),
  port: Number(configService.get('REDIS_PORT')),
  key: configService.get('REDIS_PREFIX'),
  auth_pass: configService.get('REDIS_PASSWORD'),
};

const redisAdapter = redisIoAdapter(redisOptions);

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);
    return server;
  }
}
