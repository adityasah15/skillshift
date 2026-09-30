import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [PrismaModule, NotificationModule, RedisModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
