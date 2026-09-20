import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailProcessor } from './processors/email.processor';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'NOTIFICATION',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
    PrismaModule,
    MailModule,
  ],
  providers: [NotificationService, EmailProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
