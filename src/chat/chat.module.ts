import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { RedisModule } from 'src/redis/redis.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, RedisModule, NotificationModule],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController]
})
export class ChatModule {}
