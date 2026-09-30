import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderAutoCompleteProcessor } from './order-auto-complete.processor';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'ORDER_AUTO_COMPLETE',
    }),
  ],
  providers: [OrderAutoCompleteProcessor],
  exports: [BullModule],
})
export class OrderAutoCompleteModule {}
