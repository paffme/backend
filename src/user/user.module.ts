import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';
import { MikroOrmModule } from 'nestjs-mikro-orm';

@Module({
  controllers: [UserController],
  exports: [UserService],
  imports: [MikroOrmModule.forFeature({ entities: [User] })],
  providers: [UserService],
})
export class UserModule {}
