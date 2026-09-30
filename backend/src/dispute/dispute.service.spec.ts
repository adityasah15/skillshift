import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import { Prisma } from 'generated/prisma/client';

describe('DisputeService', () => {
  let service: DisputeService;

  const transactionMock = {
    dispute: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    escrow: {
      updateMany: jest.fn(),
    },
    wallet: {
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
  };

  const prismaMock = {
    order: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    dispute: {
      findUnique: jest.fn(),
    },
    escrow: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: Prisma.TransactionClient) => Promise<unknown>) =>
        callback(transactionMock as unknown as Prisma.TransactionClient),
    ),
  };

  const notificationMock = {
    enqueue: jest.fn(),
  };
  const redisMock = {
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: NotificationService,
          useValue: notificationMock,
        },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when the order does not exist', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null);

    await expect(
      service.create('user-id', {
        orderId: 'order-id',
        reason: 'Test dispute',
      }),
    ).rejects.toThrow(new NotFoundException('Order not found'));

    expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-id' },
    });
  });

  it("should reject creating a dispute for another client's order", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      clientId: 'another-user',
      status: 'IN_PROGRESS',
    });

    await expect(
      service.create('user-id', {
        orderId: 'order-id',
        reason: 'Test dispute',
      }),
    ).rejects.toThrow(
      'You are not authorized to create a dispute for this order',
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should reject disputes for orders that are not active or delivered', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      clientId: 'user-id',
      status: 'COMPLETED',
    });

    await expect(
      service.create('user-id', {
        orderId: 'order-id',
        reason: 'Test dispute',
      }),
    ).rejects.toThrow(
      'You can only create a dispute for orders that are in progress or delivered',
    );

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should open a dispute transactionally and notify administrators', async () => {
    const order = {
      clientId: 'user-id',
      status: 'IN_PROGRESS',
    };
    const dispute = { id: 'dispute-id', orderId: 'order-id' };
    prismaMock.order.findUnique.mockResolvedValue(order);
    transactionMock.dispute.create.mockResolvedValue(dispute);
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'admin-1' },
      { id: 'admin-2' },
    ]);

    await expect(
      service.create('user-id', {
        orderId: 'order-id',
        reason: 'Work was not delivered',
      }),
    ).resolves.toBe(dispute);

    expect(transactionMock.dispute.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-id',
        reason: 'Work was not delivered',
        clientId: 'user-id',
        status: 'OPEN',
      },
    });
    expect(transactionMock.order.update).toHaveBeenCalledWith({
      where: { id: 'order-id' },
      data: { status: 'DISPUTED' },
    });
    expect(transactionMock.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DISPUTE_OPENED',
        userId: 'user-id',
        orderId: 'order-id',
        before: { orderStatus: 'IN_PROGRESS' },
        after: { orderStatus: 'DISPUTED' },
      }) as unknown,
    });
    expect(redisMock.del).toHaveBeenCalledWith('admin:analytics:dashboard');
    expect(notificationMock.enqueue).toHaveBeenCalledTimes(2);
    expect(notificationMock.enqueue).toHaveBeenCalledWith(
      'admin-1',
      'DISPUTE_OPENED',
      'New dispute opened',
      'A new dispute has been opened for order order-id.',
    );
  });

  it('notifies both order participants and audits the order transition when resolved', async () => {
    prismaMock.dispute.findUnique.mockResolvedValue({
      id: 'dispute-id',
      orderId: 'order-id',
      status: 'OPEN',
      order: {
        clientId: 'client-1',
        freelancerId: 'freelancer-1',
        status: 'DISPUTED',
      },
    });
    prismaMock.escrow.findUnique.mockResolvedValue({
      status: 'HOLDING',
      amount: 100,
    });
    transactionMock.dispute.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.escrow.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.wallet.update.mockResolvedValue({ id: 'wallet-1' });
    transactionMock.transaction.create.mockResolvedValue({});
    transactionMock.dispute.findUnique.mockResolvedValue({ id: 'dispute-id' });

    await expect(
      service.resolve(
        'dispute-id',
        { resolution: 'RESOLVED_FREELANCER', adminNote: 'Work completed' },
        'admin-1',
      ),
    ).resolves.toEqual({ id: 'dispute-id' });

    expect(transactionMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'admin-1',
        orderId: 'order-id',
        action: 'ORDER_STATUS_CHANGED',
        before: { status: 'DISPUTED' },
        after: { status: 'COMPLETED' },
      },
    });
    expect(redisMock.del).toHaveBeenCalledWith('admin:analytics:dashboard');
    expect(notificationMock.enqueue).toHaveBeenCalledTimes(2);
    expect(notificationMock.enqueue).toHaveBeenCalledWith(
      'client-1',
      'DISPUTE_RESOLVED',
      'Dispute resolved',
      'The dispute for order order-id has been resolved.',
    );
    expect(notificationMock.enqueue).toHaveBeenCalledWith(
      'freelancer-1',
      'DISPUTE_RESOLVED',
      'Dispute resolved',
      'The dispute for order order-id has been resolved.',
    );
  });
});
