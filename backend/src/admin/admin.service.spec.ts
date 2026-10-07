import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('AdminService', () => {
  let service: AdminService;
  const prisma = {
    user: { findMany: jest.fn() },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    order: { findMany: jest.fn() },
  };
  const redis = {
    del: jest.fn(),
    delByPattern: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RedisService,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('admin lists', () => {
    it('returns bounded non-deleted users with intentional fields', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.listUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('returns bounded non-deleted services with selected admin fields', async () => {
      prisma.service.findMany.mockResolvedValue([]);

      await service.listServices();

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          deliveryDays: true,
          skills: true,
          imageUrls: true,
          status: true,
          createdAt: true,
          freelancer: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('returns bounded orders with only admin-list fields', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.listOrders();

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          status: true,
          price: true,
          createdAt: true,
          service: { select: { title: true } },
          client: { select: { email: true } },
          freelancer: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('moderateService', () => {
    it('invalidates service detail and list caches after moderation', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: 'service-1',
        status: 'PENDING_REVIEW',
        deletedAt: null,
      });
      const moderated = {
        id: 'service-1',
        title: 'Logo design',
        status: 'ACTIVE',
        deletedAt: null,
      };
      prisma.service.update.mockResolvedValue(moderated);

      await expect(
        service.moderateService('service-1', 'ACTIVE'),
      ).resolves.toBe(moderated);

      expect(redis.del).toHaveBeenCalledWith('service:v2:service-1');
      expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
      expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
    });

    it('does not update or invalidate caches for a missing service', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.moderateService('missing', 'ACTIVE'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.service.update).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
      expect(redis.delByPattern).not.toHaveBeenCalled();
    });
  });
});
