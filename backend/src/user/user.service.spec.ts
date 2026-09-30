import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('UserService', () => {
  let service: UserService;
  const prisma = {
    user: { findUnique: jest.fn() },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a cached public profile without querying Prisma', async () => {
    const profile = { displayName: 'Taylor', rating: 4.9 };
    redis.get.mockResolvedValue(JSON.stringify(profile));

    await expect(service.getPublicProfile('freelancer-1')).resolves.toEqual(
      profile,
    );
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it('caches public profiles for ten minutes', async () => {
    const profile = { displayName: 'Taylor', rating: 4.9 };
    redis.get.mockResolvedValue(null);
    prisma.profile.findUnique.mockResolvedValue(profile);

    await expect(service.getPublicProfile('freelancer-1')).resolves.toBe(
      profile,
    );
    expect(redis.set).toHaveBeenCalledWith(
      'profiles:freelancer:freelancer-1',
      JSON.stringify(profile),
      600,
    );
  });

  it('invalidates the public profile cache after profile updates', async () => {
    const profile = { userId: 'freelancer-1', displayName: 'Taylor' };
    prisma.profile.update.mockResolvedValue(profile);

    await expect(
      service.updateProfile('freelancer-1', { displayName: 'Taylor' }),
    ).resolves.toBe(profile);
    expect(redis.del).toHaveBeenCalledWith('profiles:freelancer:freelancer-1');
  });
});
