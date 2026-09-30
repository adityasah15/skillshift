import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };
  const prismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      prismaService as unknown as PrismaService,
    );
  });

  it('accepts a token for an active user', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@example.com',
      role: 'CLIENT',
    };
    prismaService.user.findUnique.mockResolvedValue({ deletedAt: null });

    await expect(strategy.validate(payload)).resolves.toBe(payload);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { deletedAt: true },
    });
  });

  it('rejects tokens for disabled or missing users', async () => {
    const payload = {
      sub: 'user-1',
      email: 'user@example.com',
      role: 'CLIENT',
    };
    prismaService.user.findUnique.mockResolvedValue({ deletedAt: new Date() });

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let provider: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    provider = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
