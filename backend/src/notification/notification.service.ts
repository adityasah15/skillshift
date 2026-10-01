import { Injectable } from '@nestjs/common';
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
    orderId?: string,
  ) {
    return this.prismaService.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        orderId,
      },
    });
  }

  async enqueue(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    orderId?: string,
  ) {
    return this.notificationQueue.add('notification', {
      userId,
      type,
      title,
      body,
      orderId,
    });
  }

  async enqueueEmail(type: string, data: Record<string, unknown>) {
    return this.notificationQueue.add(type, data);
  }

  async listForUser(userId: string) {
    const notifications = await this.prismaService.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      message: notification.body,
      createdAt: notification.createdAt,
      read: notification.isRead,
      link: notification.orderId
        ? notification.type === 'MESSAGE_RECEIVED'
          ? `/orders/${notification.orderId}/chat`
          : `/orders/${notification.orderId}`
        : notification.type === 'PAYMENT_RECEIVED'
          ? '/wallet'
          : null,
    }));
  }

  async markRead(userId: string, notificationId: string) {
    return this.prismaService.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async unreadCount(userId: string) {
    return this.prismaService.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAllRead(userId: string) {
    return this.prismaService.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
