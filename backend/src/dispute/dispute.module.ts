import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [PrismaModule, NotificationModule, RedisModule],
  controllers: [DisputeController],
  providers: [DisputeService],
})
export class DisputeModule {}
