import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { ServiceStatus } from 'generated/prisma/enums';

describe('ServiceService', () => {
  let service: ServiceService;
  const prisma = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delByPattern: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
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

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a service and invalidates the listing cache', async () => {
    const dto = {
      title: 'Logo design',
      description: 'A custom logo',
      price: 100,
      deliveryDays: 3,
      skills: ['design'],
      imageUrls: [],
    };
    const created = { id: 'service-1', ...dto, freelancerId: 'user-1' };
    prisma.service.create.mockResolvedValue(created);

    await expect(service.create('user-1', dto)).resolves.toBe(created);
    expect(prisma.service.create).toHaveBeenCalledWith({
      data: { ...dto, freelancerId: 'user-1' },
    });
    expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
    expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
  });

  it('returns cached service lists without querying the database', async () => {
    const cached = {
      data: [{ id: 'service-1' }],
      meta: { cursor: 'service-1', hasMore: false },
    };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    await expect(service.findAll({})).resolves.toEqual(cached);
    expect(prisma.service.findMany).not.toHaveBeenCalled();
  });

  it("returns only the current freelancer's non-deleted services", async () => {
    const services = [{ id: 'service-1', freelancerId: 'user-1' }];
    prisma.service.findMany.mockResolvedValue(services);

    await expect(service.findMine('user-1')).resolves.toBe(services);
    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: { freelancerId: 'user-1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('filters and paginates service lists before caching the response', async () => {
    const services = [
      { id: 'service-1' },
      { id: 'service-2' },
      { id: 'service-3' },
    ];
    redis.get.mockResolvedValue(null);
    prisma.service.findMany.mockResolvedValue(services);
    const query = {
      skills: ['design'],
      minPrice: 10,
      maxPrice: 500,
      cursor: 'service-0',
      limit: 2,
    };

    await expect(service.findAll(query)).resolves.toEqual({
      data: services.slice(0, 2),
      meta: { cursor: 'service-2', hasMore: true },
    });
    expect(prisma.service.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        status: ServiceStatus.ACTIVE,
        skills: { hasEvery: ['design'] },
        price: { gte: 10, lte: 500 },
      },
      cursor: { id: 'service-0' },
      skip: 1,
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    expect(redis.set).toHaveBeenCalledWith(
      `services:v2:${JSON.stringify(query)}`,
      JSON.stringify({
        data: services.slice(0, 2),
        meta: { cursor: 'service-2', hasMore: true },
      }),
      300,
    );
  });

  it('returns an empty page with no cursor when no services match', async () => {
    redis.get.mockResolvedValue(null);
    prisma.service.findMany.mockResolvedValue([]);

    await expect(service.findAll({})).resolves.toEqual({
      data: [],
      meta: { cursor: null, hasMore: false },
    });
    expect(prisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, status: ServiceStatus.ACTIVE, price: {} },
        take: 21,
      }),
    );
  });

  it('returns a cached service without querying the database', async () => {
    const cached = { id: 'service-1' };
    redis.get.mockResolvedValue(JSON.stringify(cached));

    await expect(service.findOne('service-1')).resolves.toEqual(cached);
    expect(prisma.service.findFirst).not.toHaveBeenCalled();
  });

  it('loads and caches a service that is not cached', async () => {
    const found = { id: 'service-1', title: 'Logo design' };
    redis.get.mockResolvedValue(null);
    prisma.service.findFirst.mockResolvedValue(found);

    await expect(service.findOne('service-1')).resolves.toBe(found);
    expect(prisma.service.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'service-1',
        deletedAt: null,
        status: ServiceStatus.ACTIVE,
      },
    });
    expect(redis.set).toHaveBeenCalledWith(
      'service:v2:service-1',
      JSON.stringify(found),
      600,
    );
  });

  it('throws when a service lookup finds no active service', async () => {
    redis.get.mockResolvedValue(null);
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(
      'Service not found.',
    );
  });

  it('updates an owned service and invalidates both caches', async () => {
    const existing = { id: 'service-1' };
    const updated = { ...existing, title: 'Updated title' };
    prisma.service.findFirst.mockResolvedValue(existing);
    prisma.service.update.mockResolvedValue(updated);

    await expect(
      service.update('user-1', { title: 'Updated title' }, 'service-1'),
    ).resolves.toBe(updated);
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { title: 'Updated title' },
    });
    expect(redis.del).toHaveBeenCalledWith('service:v2:service-1');
    expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
    expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
  });

  it('throws when updating a missing or unowned service', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(service.update('user-1', {}, 'service-1')).rejects.toThrow(
      'Service not found.',
    );
    expect(prisma.service.update).not.toHaveBeenCalled();
  });

  it('soft deletes a service and invalidates both caches', async () => {
    const existing = { id: 'service-1' };
    prisma.service.findFirst.mockResolvedValue(existing);
    prisma.service.update.mockResolvedValue({
      ...existing,
      deletedAt: new Date(),
    });

    await service.delete('user-1', 'service-1');

    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { deletedAt: expect.any(Date) as unknown },
    });
    expect(redis.del).toHaveBeenCalledWith('service:v2:service-1');
    expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
    expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
  });

  it('throws when deleting a missing service', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(service.delete('user-1', 'service-1')).rejects.toThrow(
      'Service not found.',
    );
  });

  it('approves a service and invalidates both caches', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'service-1' });
    const approved = { id: 'service-1', status: 'ACTIVE' };
    prisma.service.update.mockResolvedValue(approved);

    await expect(service.approve('service-1')).resolves.toBe(approved);
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { status: 'ACTIVE' },
    });
    expect(redis.del).toHaveBeenCalledWith('service:v2:service-1');
    expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
    expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
  });

  it('throws when approving a missing service', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(service.approve('missing')).rejects.toThrow(
      'Service not found.',
    );
  });

  it('rejects a service and invalidates both caches', async () => {
    prisma.service.findFirst.mockResolvedValue({ id: 'service-1' });
    const rejected = { id: 'service-1', status: 'REJECTED' };
    prisma.service.update.mockResolvedValue(rejected);

    await expect(service.reject('service-1')).resolves.toBe(rejected);
    expect(prisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { status: 'REJECTED' },
    });
    expect(redis.del).toHaveBeenCalledWith('service:v2:service-1');
    expect(redis.delByPattern).toHaveBeenCalledWith('services:*');
    expect(redis.delByPattern).toHaveBeenCalledWith('search:services:*');
  });

  it('throws when rejecting a missing service', async () => {
    prisma.service.findFirst.mockResolvedValue(null);

    await expect(service.reject('missing')).rejects.toThrow(
      'Service not found.',
    );
  });
});
