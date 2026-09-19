import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from '../notification.service';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('NOTIFICATION')
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }
  async process(job: Job) {
    if (job.name !== 'notification') {
      return;
    }
    const { userId, type, title, body } = job.data;
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    await this.mailService.sendNotificationEmail(user.email, title, body);
    await this.notificationService.create(userId, type, title, body);
  }
}
