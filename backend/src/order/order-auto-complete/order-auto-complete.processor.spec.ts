import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { Prisma } from 'generated/prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { OrderAutoCompleteProcessor } from './order-auto-complete.processor';

type TransactionCallback = (
  transaction: Prisma.TransactionClient,
) => Promise<unknown>;

describe('OrderAutoCompleteProcessor', () => {
  let processor: OrderAutoCompleteProcessor;

  const prisma = {
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const notificationService = {
    enqueue: jest.fn(),
  };
  const redisService = {
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderAutoCompleteProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    processor = module.get<OrderAutoCompleteProcessor>(
      OrderAutoCompleteProcessor,
    );
  });

  it('notifies the freelancer after an order is auto-completed', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      price: 100,
      status: 'DELIVERED',
      autoCompleteAt: new Date(Date.now() - 1000),
    });
    prisma.$transaction.mockImplementation((callback: TransactionCallback) => {
      const tx = {
        order: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        escrow: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        wallet: { update: jest.fn().mockResolvedValue({ id: 'wallet-1' }) },
        transaction: { create: jest.fn().mockResolvedValue({}) },
        auditLog: { create: jest.fn().mockResolvedValue({}) },
      };

      return callback(tx as unknown as Prisma.TransactionClient);
    });
    notificationService.enqueue.mockResolvedValue(undefined);

    await processor.process({
      name: 'auto-complete-order',
      data: { orderId: 'order-1' },
    } as Job<{ orderId: string }>);

    expect(notificationService.enqueue).toHaveBeenCalledWith(
      'freelancer-1',
      'ORDER_COMPLETED',
      'Order completed',
      'Your order has been completed and payment has been released.',
    );
    expect(redisService.del).toHaveBeenCalledWith('admin:analytics:dashboard');
  });

  it('does not notify when another worker already completed the order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      price: 100,
      status: 'DELIVERED',
      autoCompleteAt: new Date(Date.now() - 1000),
    });
    prisma.$transaction.mockImplementation((callback: TransactionCallback) => {
      const tx = {
        order: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      };

      return callback(tx as unknown as Prisma.TransactionClient);
    });

    await processor.process({
      name: 'auto-complete-order',
      data: { orderId: 'order-1' },
    } as Job<{ orderId: string }>);

    expect(notificationService.enqueue).not.toHaveBeenCalled();
    expect(redisService.del).not.toHaveBeenCalled();
  });
});
