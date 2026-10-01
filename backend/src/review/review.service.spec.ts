import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';
import { Prisma } from 'generated/prisma/client';
import { OrderStatus } from 'generated/prisma/enums';

type TransactionCallback = (
  transaction: Prisma.TransactionClient,
) => Promise<unknown>;

describe('ReviewService', () => {
  let service: ReviewService;
  const prisma = {
    order: { findUnique: jest.fn() },
    review: { findUnique: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const notificationService = { enqueue: jest.fn() };
  const redisService = { del: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists service reviews with only public reviewer fields', async () => {
    const reviews = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Excellent',
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        reviewer: {
          profile: { displayName: 'Alex', avatarUrl: null },
        },
      },
    ];
    prisma.review.findMany.mockResolvedValue(reviews);

    await expect(service.listForService('service-1')).resolves.toBe(reviews);
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { serviceId: 'service-1' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: {
          select: {
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  });

  it('invalidates the public freelancer profile after a new rating', async () => {
    const review = { id: 'review-1', revieweeId: 'freelancer-1' };
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      serviceId: 'service-1',
      status: OrderStatus.COMPLETED,
    });
    prisma.review.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((callback: TransactionCallback) => {
      const tx = {
        review: { create: jest.fn().mockResolvedValue(review) },
        profile: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ rating: 0, totalReviews: 0 }),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      return callback(tx as unknown as Prisma.TransactionClient);
    });

    await expect(
      service.create(
        { orderId: 'order-1', rating: 5, comment: 'Excellent' },
        'client-1',
      ),
    ).resolves.toBe(review);

    expect(redisService.del).toHaveBeenCalledWith(
      'profiles:freelancer:freelancer-1',
    );
  });
});
