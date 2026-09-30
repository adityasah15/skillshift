import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

import { OrderService } from './order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EscrowService } from 'src/escrow/escrow.service';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import {
  NotificationType,
  OrderStatus,
  ServiceStatus,
} from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

type TransactionCallback = (
  transaction: Prisma.TransactionClient,
) => Promise<unknown>;

describe('OrderService', () => {
  let service: OrderService;

  const prisma = {
    service: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const escrowService = {
    hold: jest.fn(),
    release: jest.fn(),
    refund: jest.fn(),
  };

  const autoCompleteQueue = {
    add: jest.fn(),
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
        OrderService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EscrowService,
          useValue: escrowService,
        },
        {
          provide: getQueueToken('ORDER_AUTO_COMPLETE'),
          useValue: autoCompleteQueue,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('create', () => {
    const dto = {
      serviceId: 'service-1',
      requirements: 'Build my website',
    };

    const serviceData = {
      id: 'service-1',
      freelancerId: 'freelancer-1',
      price: 100,
      deliveryDays: 7,
      deletedAt: null,
      status: ServiceStatus.ACTIVE,
    };

    it('should throw when service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw when service is deleted', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...serviceData,
        deletedAt: new Date(),
      });

      await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw when service is not active', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...serviceData,
        status: ServiceStatus.PENDING_REVIEW,
      });

      await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject ordering own service', async () => {
      prisma.service.findUnique.mockResolvedValue(serviceData);

      await expect(service.create('freelancer-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject insufficient balance', async () => {
      prisma.service.findUnique.mockResolvedValue(serviceData);

      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'client-1',
        balance: 50,
      });

      await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should create order and hold escrow', async () => {
      prisma.service.findUnique.mockResolvedValue(serviceData);

      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'client-1',
        balance: 500,
      });

      const createdOrder = {
        id: 'order-1',
        clientId: 'client-1',
        freelancerId: 'freelancer-1',
        serviceId: 'service-1',
        price: 100,
        deliveryDays: 7,
        requirements: dto.requirements,
        status: OrderStatus.IN_PROGRESS,
      };

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            wallet: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            order: {
              create: jest.fn().mockResolvedValue(createdOrder),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({}),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx);
        },
      );

      escrowService.hold.mockResolvedValue({});
      notificationService.enqueue.mockResolvedValue(undefined);

      const result = await service.create('client-1', dto);

      expect(result).toEqual(createdOrder);
      expect(redisService.del).toHaveBeenCalledWith(
        'admin:analytics:dashboard',
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(escrowService.hold).toHaveBeenCalledWith(
        expect.any(Object),
        100,
        'order-1',
      );

      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'freelancer-1',
        NotificationType.ORDER_PLACED,
        'New order received',
        'You have received a new order.',
      );
    });

    it('should not create an order when the atomic debit finds insufficient funds', async () => {
      prisma.service.findUnique.mockResolvedValue(serviceData);
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'client-1',
        balance: 500,
      });

      let orderCreate = jest.fn();
      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          orderCreate = jest.fn();
          const tx = {
            wallet: {
              updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            },
            order: {
              create: orderCreate,
            },
            transaction: {
              create: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          };

          return callback(tx);
        },
      );

      await expect(service.create('client-1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(orderCreate).not.toHaveBeenCalled();
      expect(escrowService.hold).not.toHaveBeenCalled();
      expect(notificationService.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const order = {
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
    };

    it('should throw when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw when user is not involved in order', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.findOne('other-user', 'order-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return order for client', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(service.findOne('client-1', 'order-1')).resolves.toEqual(
        order,
      );
    });

    it('should return order for freelancer', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(service.findOne('freelancer-1', 'order-1')).resolves.toEqual(
        order,
      );
    });
  });

  describe('deliver', () => {
    const order = {
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      status: OrderStatus.IN_PROGRESS,
    };

    it('should throw when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.deliver('freelancer-1', 'order-1', 'Done'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject another freelancer', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.deliver('other-freelancer', 'order-1', 'Done'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should reject non in-progress order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.deliver('freelancer-1', 'order-1', 'Done'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should deliver order and schedule auto completion', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const updatedOrder = {
        ...order,
        status: OrderStatus.DELIVERED,
        deliveryNote: 'Done',
        autoCompleteAt: new Date(),
      };

      const auditLogCreate = jest.fn().mockResolvedValue({});
      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(updatedOrder),
            },
            auditLog: {
              create: auditLogCreate,
            },
          };

          return callback(tx);
        },
      );

      notificationService.enqueue.mockResolvedValue(undefined);
      autoCompleteQueue.add.mockResolvedValue({});

      const result = await service.deliver('freelancer-1', 'order-1', 'Done');

      expect(result).toEqual(updatedOrder);
      expect(redisService.del).toHaveBeenCalledWith(
        'admin:analytics:dashboard',
      );

      expect(auditLogCreate).toHaveBeenCalledWith({
        data: {
          userId: 'freelancer-1',
          orderId: 'order-1',
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.IN_PROGRESS },
          after: { status: OrderStatus.DELIVERED },
        },
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'client-1',
        NotificationType.ORDER_DELIVERED,
        'Order delivered',
        'Your order has been delivered.',
      );

      expect(autoCompleteQueue.add).toHaveBeenCalledWith(
        'auto-complete-order',
        { orderId: 'order-1' },
        {
          delay: 7 * 24 * 60 * 60 * 1000,
          jobId: 'order-order-1',
        },
      );
    });
  });

  describe('complete', () => {
    const order = {
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      price: 100,
      status: OrderStatus.DELIVERED,
    };

    it('should throw when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.complete('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject another client', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.complete('other-client', 'order-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should reject non-delivered order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: OrderStatus.IN_PROGRESS,
      });

      await expect(
        service.complete('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject when freelancer wallet does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(order),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
            wallet: {
              findUnique: jest.fn().mockResolvedValue(null),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
            },
          };

          return callback(tx);
        },
      );

      escrowService.release.mockResolvedValue({});

      await expect(
        service.complete('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should complete order and release escrow', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const completedOrder = {
        ...order,
        status: OrderStatus.COMPLETED,
      };

      const freelancerWallet = {
        id: 'wallet-2',
        userId: 'freelancer-1',
        balance: 50,
      };
      const auditLogCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(completedOrder),
            },
            auditLog: {
              create: auditLogCreate,
            },
            wallet: {
              findUnique: jest.fn().mockResolvedValue(freelancerWallet),
              update: jest.fn().mockResolvedValue({}),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx);
        },
      );

      escrowService.release.mockResolvedValue({});
      notificationService.enqueue.mockResolvedValue(undefined);

      const result = await service.complete('client-1', 'order-1');

      expect(result).toEqual(completedOrder);
      expect(redisService.del).toHaveBeenCalledWith(
        'admin:analytics:dashboard',
      );
      expect(auditLogCreate).toHaveBeenCalledWith({
        data: {
          userId: 'client-1',
          orderId: 'order-1',
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.DELIVERED },
          after: { status: OrderStatus.COMPLETED },
        },
      });

      expect(escrowService.release).toHaveBeenCalledWith(
        expect.any(Object),
        'order-1',
      );

      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'freelancer-1',
        NotificationType.ORDER_COMPLETED,
        'Order completed',
        'Your order has been completed and payment has been released.',
      );
    });
  });

  describe('cancel', () => {
    const order = {
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      price: 100,
      status: OrderStatus.IN_PROGRESS,
    };

    it('should throw when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.cancel('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject unrelated user', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.cancel('other-user', 'order-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should reject non in-progress order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...order,
        status: OrderStatus.COMPLETED,
      });

      await expect(
        service.cancel('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject when client wallet does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(order),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
            wallet: {
              findUnique: jest.fn().mockResolvedValue(null),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
            },
          };

          return callback(tx);
        },
      );

      escrowService.refund.mockResolvedValue({});

      await expect(
        service.cancel('client-1', 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should cancel order and refund client', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const cancelledOrder = {
        ...order,
        status: OrderStatus.CANCELLED,
      };

      const clientWallet = {
        id: 'wallet-1',
        userId: 'client-1',
        balance: 50,
      };
      const auditLogCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(cancelledOrder),
            },
            auditLog: {
              create: auditLogCreate,
            },
            wallet: {
              findUnique: jest.fn().mockResolvedValue(clientWallet),
              update: jest.fn().mockResolvedValue({}),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx);
        },
      );

      escrowService.refund.mockResolvedValue({});
      notificationService.enqueue.mockResolvedValue(undefined);

      const result = await service.cancel('client-1', 'order-1');

      expect(result).toEqual(cancelledOrder);
      expect(redisService.del).toHaveBeenCalledWith(
        'admin:analytics:dashboard',
      );
      expect(auditLogCreate).toHaveBeenCalledWith({
        data: {
          userId: 'client-1',
          orderId: 'order-1',
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.IN_PROGRESS },
          after: { status: OrderStatus.CANCELLED },
        },
      });

      expect(escrowService.refund).toHaveBeenCalledWith(
        expect.any(Object),
        'order-1',
      );

      expect(notificationService.enqueue).toHaveBeenCalledTimes(2);
      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'client-1',
        NotificationType.ORDER_CANCELLED,
        'Order cancelled',
        'An order you were involved in has been cancelled and the payment has been refunded.',
      );
      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'freelancer-1',
        NotificationType.ORDER_CANCELLED,
        'Order cancelled',
        'An order you were involved in has been cancelled and the payment has been refunded.',
      );
    });

    it('should notify client when freelancer cancels', async () => {
      prisma.order.findUnique.mockResolvedValue(order);

      const cancelledOrder = {
        ...order,
        status: OrderStatus.CANCELLED,
      };

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            order: {
              update: jest.fn().mockResolvedValue(cancelledOrder),
            },
            auditLog: {
              create: jest.fn().mockResolvedValue({}),
            },
            wallet: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'wallet-1',
                userId: 'client-1',
                balance: 50,
              }),
              update: jest.fn().mockResolvedValue({}),
            },
            transaction: {
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx);
        },
      );

      escrowService.refund.mockResolvedValue({});
      notificationService.enqueue.mockResolvedValue(undefined);

      await service.cancel('freelancer-1', 'order-1');

      expect(notificationService.enqueue).toHaveBeenCalledTimes(2);
      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'client-1',
        NotificationType.ORDER_CANCELLED,
        'Order cancelled',
        'An order you were involved in has been cancelled and the payment has been refunded.',
      );
      expect(notificationService.enqueue).toHaveBeenCalledWith(
        'freelancer-1',
        NotificationType.ORDER_CANCELLED,
        'Order cancelled',
        'An order you were involved in has been cancelled and the payment has been refunded.',
      );
    });
  });
});
