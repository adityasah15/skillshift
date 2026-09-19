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
    }),
    PrismaModule,
    MailModule,
  ],
  providers: [NotificationService, EmailProcessor],
})
export class NotificationModule {}
