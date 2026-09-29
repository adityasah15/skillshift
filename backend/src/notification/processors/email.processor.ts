import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationService } from '../notification.service';
import { MailService } from 'src/mail/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';

type EmailJobData =
  | {
      userId: string;
      type: NotificationType;
      title: string;
      body: string;
    }
  | { email: string; token: string };

@Processor('NOTIFICATION')
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>) {
    if (job.name === 'notification') {
      if (!('userId' in job.data)) {
        throw new Error('Invalid notification job data');
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
      return;
    }

    if (job.name === 'verification-email') {
      if (!('email' in job.data)) {
        throw new Error('Invalid verification email job data');
      }

      const { email, token } = job.data;
      await this.mailService.sendVerificationEmail(email, token);
      return;
    }

    if (job.name === 'password-reset') {
      if (!('email' in job.data)) {
        throw new Error('Invalid password reset job data');
      }

      const { email, token } = job.data;
      await this.mailService.sendPasswordResetEmail(email, token);
      return;
    }
  }
}
