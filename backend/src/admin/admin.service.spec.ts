import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('AdminService', () => {
  let service: AdminService;
  const prisma = {
    service: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
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
