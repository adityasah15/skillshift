import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { Role } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

type TransactionCallback = (
  transaction: Prisma.TransactionClient,
) => Promise<unknown>;

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    wallet: {
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  const notificationService = {
    enqueueEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
      role: Role.CLIENT,
    };

    it('should reject duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should register a user and create profile and wallet', async () => {
      const user = {
        id: 'user-1',
        email: dto.email,
        role: Role.CLIENT,
      };

      prisma.user.findUnique.mockResolvedValue(null);

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce('password-hash')
        .mockResolvedValueOnce('verification-hash');

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            user: {
              create: jest.fn().mockResolvedValue({
                ...user,
                passwordHash: 'password-hash',
                emailVerifyTokenHash: 'verification-hash',
              }),
            },
            profile: {
              create: jest.fn().mockResolvedValue({}),
            },
            wallet: {
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx as unknown as Prisma.TransactionClient);
        },
      );

      notificationService.enqueueEmail.mockResolvedValue(undefined);

      const result = await service.register(dto);

      expect(result).toEqual({
        id: 'user-1',
        email: dto.email,
        role: Role.CLIENT,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      expect(notificationService.enqueueEmail).toHaveBeenCalledWith(
        'verification-email',
        expect.objectContaining({
          email: dto.email,
          token: expect.any(String) as unknown,
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    const email = 'user@example.com';
    const token = 'verification-token';

    it('should throw when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail(token, email)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw when email is already verified', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        isEmailVerified: true,
        emailVerifyTokenHash: 'hash',
      });

      await expect(service.verifyEmail(token, email)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw when verification token is unavailable', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        isEmailVerified: false,
        emailVerifyTokenHash: null,
      });

      await expect(service.verifyEmail(token, email)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw when verification token is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        isEmailVerified: false,
        emailVerifyTokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyEmail(token, email)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(token, 'hash');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should verify the email successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email,
        isEmailVerified: false,
        emailVerifyTokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      await expect(service.verifyEmail(token, email)).resolves.toEqual({
        message: 'Email verified successfully',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email },
        data: {
          isEmailVerified: true,
          emailVerifyTokenHash: null,
        },
      });
    });
  });

  describe('login', () => {
    const dto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('should reject invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: 'hash',
        isEmailVerified: true,
        role: Role.CLIENT,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject unverified user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: 'hash',
        isEmailVerified: false,
        role: Role.CLIENT,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should login successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: 'hash',
        isEmailVerified: true,
        role: Role.CLIENT,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('refresh-hash');

      jwtService.sign.mockReturnValue('access-token');
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: dto.email,
        role: Role.CLIENT,
      });

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: 'refresh-hash',
          expiresAt: expect.any(Date) as unknown,
        }) as unknown,
      });
    });
  });

  describe('refresh', () => {
    it('should reject malformed refresh token', async () => {
      await expect(service.refresh('invalid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await expect(service.refresh('')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject missing or revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token-id.secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        revokedAt: new Date(),
      });

      await expect(service.refresh('token-id.secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        tokenHash: 'hash',
      });

      await expect(service.refresh('token-id.secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject incorrect refresh secret', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh('token-id.secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject when refresh token user does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('token-id.secret')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should rotate refresh token successfully', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'old-token',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: 'old-hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: Role.CLIENT,
      });

      jwtService.sign.mockReturnValue('new-access-token');

      prisma.$transaction.mockImplementation(
        (callback: TransactionCallback) => {
          const tx = {
            refreshToken: {
              update: jest.fn().mockResolvedValue({}),
              create: jest.fn().mockResolvedValue({}),
            },
          };

          return callback(tx as unknown as Prisma.TransactionClient);
        },
      );

      const result = await service.refresh('old-token.old-secret');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toEqual(expect.any(String));

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should reject malformed refresh token', async () => {
      await expect(service.logout('user-1', 'invalid')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject missing or revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.logout('user-1', 'token-id.secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: new Date(),
      });

      await expect(
        service.logout('user-1', 'token-id.secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should reject token belonging to another user', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'different-user',
        revokedAt: null,
        tokenHash: 'hash',
      });

      await expect(
        service.logout('user-1', 'token-id.secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should reject invalid secret', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: null,
        tokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.logout('user-1', 'token-id.secret'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should logout successfully', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-1',
        revokedAt: null,
        tokenHash: 'hash',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.refreshToken.update.mockResolvedValue({});

      await expect(
        service.logout('user-1', 'token-id.secret'),
      ).resolves.toEqual({
        message: 'Logged out successfully',
      });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id' },
        data: {
          revokedAt: expect.any(Date) as unknown,
        },
      });
    });
  });

  describe('forgotPassword', () => {
    const dto = {
      email: 'user@example.com',
    };

    it('should return the same response when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.forgotPassword(dto)).resolves.toEqual({
        message:
          'If an account exists for this email, a password reset link has been sent.',
      });

      expect(notificationService.enqueueEmail).not.toHaveBeenCalled();
    });

    it('should create reset token and send reset email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('reset-hash');
      prisma.user.update.mockResolvedValue({});
      notificationService.enqueueEmail.mockResolvedValue(undefined);

      await expect(service.forgotPassword(dto)).resolves.toEqual({
        message:
          'If an account exists for this email, a password reset link has been sent.',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: dto.email },
        data: {
          passwordResetTokenHash: 'reset-hash',
          passwordResetExpiresAt: expect.any(Date) as unknown,
        },
      });

      expect(notificationService.enqueueEmail).toHaveBeenCalledWith(
        'password-reset',
        {
          email: dto.email,
          token: expect.any(String) as unknown,
        },
      );
    });
  });

  describe('resetPassword', () => {
    const dto = {
      email: 'user@example.com',
      token: 'reset-token',
      newPassword: 'newPassword123',
    };

    it('should reject missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject missing reset token hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject missing reset expiry', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordResetTokenHash: 'hash',
        passwordResetExpiresAt: null,
      });

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject expired reset token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordResetTokenHash: 'hash',
        passwordResetExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject invalid reset token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordResetTokenHash: 'hash',
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reset password successfully', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordResetTokenHash: 'hash',
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-password-hash');
      prisma.user.update.mockResolvedValue({});

      await expect(service.resetPassword(dto)).resolves.toEqual({
        message: 'Password changed successfully.',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: dto.email },
        data: {
          passwordHash: 'new-password-hash',
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          refreshTokens: {
            deleteMany: {},
          },
        },
      });
    });
  });
});
