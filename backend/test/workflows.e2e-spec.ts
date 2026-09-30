import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Reflector } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Prisma } from 'generated/prisma/client';
import { OrderStatus, Role, ServiceStatus } from 'generated/prisma/enums';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { DisputeController } from '../src/dispute/dispute.controller';
import { DisputeService } from '../src/dispute/dispute.service';
import { NotificationService } from '../src/notification/notification.service';
import { OrderController } from '../src/order/order.controller';
import { OrderService } from '../src/order/order.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EscrowService } from '../src/escrow/escrow.service';
import { RedisService } from '../src/redis/redis.service';
import request from 'supertest';
import { App } from 'supertest/types';
import type { Request } from 'express';

type TestRequest = Request & {
  user?: { sub: string; role: string };
};

type WalletRecord = { id: string; userId: string; balance: number };

class TestIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<TestRequest>();
    req.user = {
      sub: req.header('x-user-id') ?? 'client-1',
      role: req.header('x-role') ?? Role.CLIENT,
    };
    return true;
  }
}

type OrderRecord = {
  id: string;
  clientId: string;
  freelancerId: string;
  serviceId: string;
  price: number;
  deliveryDays: number;
  requirements?: string;
  status: OrderStatus;
  deliveryNote?: string;
  autoCompleteAt?: Date;
};

describe('Workflow API integration (Supertest)', () => {
  let app: INestApplication<App>;
  let order: OrderRecord | null;
  let dispute: Record<string, unknown> | null;
  let escrowStatus: string;

  const wallets = new Map<string, WalletRecord>();
  const authService = {
    login: jest.fn(),
    refresh: jest.fn(),
  };
  const notificationService = {
    enqueue: jest.fn(),
  };
  const redisService = {
    del: jest.fn(),
  };
  const queue = { add: jest.fn() };
  const escrowService = {
    hold: jest.fn(),
    release: jest.fn(),
    refund: jest.fn(),
  };

  const prisma = {
    service: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn((args: { where: { userId: string } }) =>
        Promise.resolve(wallets.get(args.where.userId) ?? null),
      ),
    },
    order: {
      findUnique: jest.fn(() => Promise.resolve(order)),
    },
    dispute: {
      findUnique: jest.fn(() =>
        Promise.resolve(dispute ? { ...dispute, order } : null),
      ),
    },
    escrow: {
      findUnique: jest.fn(() =>
        Promise.resolve({ status: escrowStatus, amount: 100 }),
      ),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
    },
    $transaction: jest.fn(
      (callback: (tx: Prisma.TransactionClient) => unknown) => {
        const tx = {
          wallet: {
            updateMany: jest.fn(
              (args: {
                where: { userId: string; balance: { gte: number } };
                data: { balance: { decrement: number } };
              }) => {
                const wallet = wallets.get(args.where.userId);
                if (!wallet || wallet.balance < args.where.balance.gte) {
                  return { count: 0 };
                }
                wallet.balance -= args.data.balance.decrement;
                return { count: 1 };
              },
            ),
            findUnique: jest.fn(
              (args: { where: { userId: string } }) =>
                wallets.get(args.where.userId) ?? null,
            ),
            update: jest.fn(
              (args: {
                where: { userId: string };
                data: { balance: { increment: number } };
              }) => {
                const wallet = wallets.get(args.where.userId);
                if (!wallet) throw new Error('Wallet not found');
                wallet.balance += args.data.balance.increment;
                return wallet;
              },
            ),
          },
          order: {
            create: jest.fn((args: { data: Omit<OrderRecord, 'id'> }) => {
              order = { id: 'order-1', ...args.data };
              return order;
            }),
            update: jest.fn((args: { data: Partial<OrderRecord> }) => {
              if (!order) throw new Error('Order not found');
              order = { ...order, ...args.data };
              return order;
            }),
            updateMany: jest.fn(
              (args: {
                where: { id: string; status: OrderStatus };
                data: Partial<OrderRecord>;
              }) => {
                if (
                  !order ||
                  order.id !== args.where.id ||
                  order.status !== args.where.status
                ) {
                  return { count: 0 };
                }
                order = { ...order, ...args.data };
                return { count: 1 };
              },
            ),
          },
          dispute: {
            create: jest.fn((args: { data: Record<string, unknown> }) => {
              dispute = { id: 'dispute-1', ...args.data };
              return dispute;
            }),
            updateMany: jest.fn((args: { data: Record<string, unknown> }) => {
              if (!dispute) return { count: 0 };
              dispute = { ...dispute, ...args.data };
              return { count: 1 };
            }),
            findUnique: jest.fn(() => dispute),
          },
          escrow: {
            updateMany: jest.fn(
              (args: {
                where: { status: string };
                data: { status: string };
              }) => {
                if (escrowStatus !== args.where.status) return { count: 0 };
                escrowStatus = args.data.status;
                return { count: 1 };
              },
            ),
          },
          transaction: { create: jest.fn().mockResolvedValue({}) },
          auditLog: { create: jest.fn().mockResolvedValue({}) },
        };

        return callback(tx as unknown as Prisma.TransactionClient);
      },
    ),
  };

  beforeEach(async () => {
    order = null;
    dispute = null;
    escrowStatus = 'HOLDING';
    wallets.clear();
    wallets.set('client-1', {
      id: 'wallet-client',
      userId: 'client-1',
      balance: 500,
    });
    wallets.set('freelancer-1', {
      id: 'wallet-freelancer',
      userId: 'freelancer-1',
      balance: 0,
    });
    jest.clearAllMocks();

    prisma.service.findUnique.mockResolvedValue({
      id: 'service-1',
      freelancerId: 'freelancer-1',
      price: 100,
      deliveryDays: 3,
      deletedAt: null,
      status: ServiceStatus.ACTIVE,
    });
    escrowService.hold.mockImplementation(() => {
      escrowStatus = 'HOLDING';
      return Promise.resolve();
    });
    escrowService.release.mockImplementation(() => {
      escrowStatus = 'RELEASED';
      return Promise.resolve();
    });
    escrowService.refund.mockImplementation(() => {
      escrowStatus = 'REFUNDED';
      return Promise.resolve();
    });
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    authService.refresh.mockResolvedValue({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController, OrderController, DisputeController],
      providers: [
        { provide: AuthService, useValue: authService },
        OrderService,
        DisputeService,
        { provide: PrismaService, useValue: prisma },
        { provide: EscrowService, useValue: escrowService },
        { provide: getQueueToken('ORDER_AUTO_COMPLETE'), useValue: queue },
        { provide: NotificationService, useValue: notificationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalGuards(
      new TestIdentityGuard(),
      new RolesGuard(new Reflector()),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('logs in and rotates refresh tokens through HttpOnly cookies', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'client@example.com', password: 'password123' })
      .expect(201)
      .expect(({ body, headers }) => {
        expect(body).toEqual({ accessToken: 'access-token' });
        expect(headers['set-cookie'][0]).toContain(
          'refreshToken=refresh-token',
        );
        expect(headers['set-cookie'][0]).toContain('HttpOnly');
      });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=refresh-token')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({ accessToken: 'rotated-access-token' });
      });
  });

  it('runs order creation, delivery, and completion over the HTTP API', async () => {
    const created = await request(app.getHttpServer())
      .post('/orders')
      .set('x-user-id', 'client-1')
      .set('x-role', Role.CLIENT)
      .send({ serviceId: 'service-1', requirements: 'Build my website' })
      .expect(201);

    expect(created.body).toMatchObject({ status: OrderStatus.IN_PROGRESS });
    expect(wallets.get('client-1')?.balance).toBe(400);

    await request(app.getHttpServer())
      .patch('/orders/order-1/deliver')
      .set('x-user-id', 'freelancer-1')
      .set('x-role', Role.FREELANCER)
      .send({ deliveryNote: 'Work is ready' })
      .expect(200)
      .expect(({ body }) =>
        expect(body).toMatchObject({ status: OrderStatus.DELIVERED }),
      );

    await request(app.getHttpServer())
      .post('/orders/order-1/complete')
      .set('x-user-id', 'client-1')
      .set('x-role', Role.CLIENT)
      .expect(201)
      .expect(({ body }) =>
        expect(body).toMatchObject({ status: OrderStatus.COMPLETED }),
      );

    expect(wallets.get('freelancer-1')?.balance).toBe(100);
    expect(escrowService.release).toHaveBeenCalledTimes(1);
  });

  it('opens a dispute and lets an admin resolve it over the HTTP API', async () => {
    order = {
      id: '123e4567-e89b-42d3-a456-426614174000',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      serviceId: 'service-1',
      price: 100,
      deliveryDays: 3,
      status: OrderStatus.IN_PROGRESS,
    };

    const opened = await request(app.getHttpServer())
      .post('/disputes')
      .set('x-user-id', 'client-1')
      .set('x-role', Role.CLIENT)
      .send({ orderId: order.id, reason: 'The work is incomplete' })
      .expect(201);

    expect(opened.body).toMatchObject({ status: 'OPEN' });
    expect(order.status).toBe(OrderStatus.DISPUTED);

    await request(app.getHttpServer())
      .patch('/admin/disputes/dispute-1/resolve')
      .set('x-user-id', 'admin-1')
      .set('x-role', Role.ADMIN)
      .send({ resolution: 'RESOLVED_FREELANCER', adminNote: 'Reviewed' })
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ id: 'dispute-1' }));

    expect(order.status).toBe(OrderStatus.COMPLETED);
    expect(escrowStatus).toBe('RELEASED');
    expect(wallets.get('freelancer-1')?.balance).toBe(100);
  });
});
