import { Injectable } from '@nestjs/common';
import { create } from 'domain';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue('NOTIFICATION')
    private readonly notificationQueue: Queue,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
  ) {
    return this.prismaService.notification.create({
      data: {
        userId,
        type,
        title,
        body,
      },
    });
  }

  async enqueue(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
  ) {
    return this.notificationQueue.add('notification', {
      userId,
      type,
      title,
      body,
    });
  }

  async enqueueEmail(type: string, data: Record<string, unknown>) {
    return this.notificationQueue.add(type, data);
  }
}
