import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: { $queryRaw: jest.Mock };
  let redis: { get: jest.Mock; set: jest.Mock };

  const serviceRecord = (id: string, createdAt: string) => ({
    id,
    freelancerId: `freelancer-${id}`,
    title: `Service ${id}`,
    description: `Description ${id}`,
    price: 100,
    skills: ['nestjs'],
    imageUrls: [],
    status: 'ACTIVE',
    createdAt: new Date(createdAt),
  });

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
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

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the first page and a composite cursor from the last returned record', async () => {
    prisma.$queryRaw.mockResolvedValue([
      serviceRecord('service-1', '2026-09-28T10:00:00.000Z'),
      serviceRecord('service-2', '2026-09-28T09:00:00.000Z'),
    ]);

    const response = await service.searchServices({ limit: 1 });

    expect(response.data.map((item) => item.id)).toEqual(['service-1']);
    expect(response.meta.hasMore).toBe(true);
    expect(response.meta.cursor).toBeDefined();

    const decoded = JSON.parse(
      Buffer.from(response.meta.cursor!, 'base64url').toString('utf8'),
    );

    expect(decoded).toEqual({
      createdAt: '2026-09-28T10:00:00.000Z',
      id: 'service-1',
    });
  });

  it('uses the returned cursor to continue from the next record', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([
      serviceRecord('service-1', '2026-09-28T10:00:00.000Z'),
      serviceRecord('service-2', '2026-09-28T09:00:00.000Z'),
    ]);

    const firstPage = await service.searchServices({ limit: 1 });

    prisma.$queryRaw.mockResolvedValueOnce([
      serviceRecord('service-2', '2026-09-28T09:00:00.000Z'),
      serviceRecord('service-3', '2026-09-28T08:00:00.000Z'),
    ]);

    const secondPage = await service.searchServices({
      limit: 1,
      cursor: firstPage.meta.cursor!,
    });

    expect(secondPage.data.map((item) => item.id)).toEqual(['service-2']);
    expect(secondPage.data.map((item) => item.id)).not.toContain('service-1');
    expect(secondPage.meta.hasMore).toBe(true);
  });

  it('continues across multiple consecutive pages without duplicates', async () => {
    const pages = [
      [
        serviceRecord('service-1', '2026-09-28T10:00:00.000Z'),
        serviceRecord('service-2', '2026-09-28T09:00:00.000Z'),
      ],
      [
        serviceRecord('service-2', '2026-09-28T09:00:00.000Z'),
        serviceRecord('service-3', '2026-09-28T08:00:00.000Z'),
      ],
      [serviceRecord('service-3', '2026-09-28T08:00:00.000Z')],
    ];

    prisma.$queryRaw
      .mockResolvedValueOnce(pages[0])
      .mockResolvedValueOnce(pages[1])
      .mockResolvedValueOnce(pages[2]);

    const seen: string[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await service.searchServices({ limit: 1, cursor });
      seen.push(...response.data.map((item) => item.id));
      cursor = response.meta.cursor ?? undefined;
      hasMore = response.meta.hasMore;
    }

    expect(seen).toEqual(['service-1', 'service-2', 'service-3']);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('rejects an invalid cursor', async () => {
    await expect(
      service.searchServices({ limit: 1, cursor: 'not-a-valid-cursor' }),
    ).rejects.toThrow('Invalid search cursor');

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
