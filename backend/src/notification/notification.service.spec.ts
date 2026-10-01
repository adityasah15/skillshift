import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from 'generated/prisma/enums';

describe('NotificationService', () => {
  let service: NotificationService;
  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const queue = { add: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken('NOTIFICATION'), useValue: queue },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("lists only the user's notifications and maps useful links", async () => {
    const createdAt = new Date('2026-09-01T00:00:00.000Z');
    prisma.notification.findMany.mockResolvedValue([
      {
        id: 'notification-message',
        type: NotificationType.MESSAGE_RECEIVED,
        body: 'New message',
        createdAt,
        isRead: false,
        orderId: 'order-1',
      },
      {
        id: 'notification-payment',
        type: NotificationType.PAYMENT_RECEIVED,
        body: 'Payment received',
        createdAt,
        isRead: true,
        orderId: null,
      },
    ]);

    await expect(service.listForUser('user-1')).resolves.toEqual([
      {
        id: 'notification-message',
        type: NotificationType.MESSAGE_RECEIVED,
        message: 'New message',
        createdAt,
        read: false,
        link: '/orders/order-1/chat',
      },
      {
        id: 'notification-payment',
        type: NotificationType.PAYMENT_RECEIVED,
        message: 'Payment received',
        createdAt,
        read: true,
        link: '/wallet',
      },
    ]);
    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('marks read only for the specified user and notification', async () => {
    await service.markRead('user-1', 'notification-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
      data: { isRead: true },
    });
  });

  it('counts unread notifications only for the specified user', async () => {
    prisma.notification.count.mockResolvedValue(2);

    await expect(service.unreadCount('user-1')).resolves.toBe(2);
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
    });
  });

  it('marks all unread notifications only for the specified user', async () => {
    await service.markAllRead('user-1');

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
      data: { isRead: true },
    });
  });

  it('carries an order id through the notification job', async () => {
    await service.enqueue(
      'user-1',
      NotificationType.ORDER_DELIVERED,
      'Order delivered',
      'Delivery is ready',
      'order-1',
    );

    expect(queue.add).toHaveBeenCalledWith('notification', {
      userId: 'user-1',
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order delivered',
      body: 'Delivery is ready',
      orderId: 'order-1',
    });
  });
});
