import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { MikroOrmModule } from 'nestjs-mikro-orm';
import { Timestamp } from '../shared/entity/timestamp.entity';

@Module({
  controllers: [UserController],
  exports: [UserService],
  imports: [MikroOrmModule.forFeature({ entities: [User] })],
  providers: [UserService],
})
export class UserModule {}
