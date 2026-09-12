import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = await bcrypt.hash(verificationToken, 12);
    const result = await this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash,
          emailVerifyTokenHash: verificationTokenHash,
        },
      });
      await tx.profile.create({
        data: {
          userId: user.id,
          displayName: user.email.split('@')[0],
        },
      });
      await tx.wallet.create({
        data: {
          userId: user.id,
        },
      });
      return user;
    });
    await this.mailService.sendVerificationEmail(
      result.email,
      verificationToken,
    );
    return {
      id: result.id,
      email: result.email,
      role: result.role,
    };
  }

  async verifyEmail(token: string, email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }
    if (!user.emailVerifyTokenHash) {
      throw new BadRequestException('Verification token is unavailable');
    }
    const match = await bcrypt.compare(token, user.emailVerifyTokenHash);
    if (!match) {
      throw new BadRequestException('Invalid verification token');
    }
    await this.prismaService.user.update({
      where: { email },
      data: { isEmailVerified: true, emailVerifyTokenHash: null },
    });
    return {
      message: 'Email verified successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });
    if (existingUser) {
      const match = await bcrypt.compare(
        loginDto.password,
        existingUser.passwordHash,
      );
      if (match) {
        if (!existingUser.isEmailVerified) {
          throw new BadRequestException('Please verify your email first');
        }
        const accessToken = this.jwtService.sign({
          sub: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        });
        const tokenId = randomUUID();
        const secret = randomBytes(32).toString('hex');
        const refreshToken = `${tokenId}.${secret}`;
        const refreshTokenHash = await bcrypt.hash(secret, 12);
        await this.prismaService.refreshToken.create({
          data: {
            id: tokenId,
            userId: existingUser.id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        return {
          accessToken,
          refreshToken,
        };
      }
    }
    throw new BadRequestException('Invalid email or password');
  }

  async refresh(refreshToken: string) {
    const [tokenId, secret] = refreshToken.split('.');

    if (!tokenId || !secret) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const matchedToken = await this.prismaService.refreshToken.findUnique({
      where: {
        id: tokenId,
      },
    });
    if (!matchedToken || matchedToken.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (matchedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const match = await bcrypt.compare(secret, matchedToken.tokenHash);
    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prismaService.user.findUnique({
      where: { id: matchedToken.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const newTokenId = randomUUID();
    const newSecret = randomBytes(32).toString('hex');

    const newRefreshToken = `${newTokenId}.${newSecret}`;

    const newRefreshTokenHash = await bcrypt.hash(newSecret, 12);

    await this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
          id: newTokenId,
          userId: user.id,
          tokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken: string) {
    const [tokenId, secret] = refreshToken.split('.');
    if (!tokenId || !secret) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const matchedToken = await this.prismaService.refreshToken.findUnique({
      where: { id: tokenId },
    });
    if (!matchedToken || matchedToken.revokedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (matchedToken.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const match = await bcrypt.compare(secret, matchedToken.tokenHash);
    if (!match) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prismaService.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revokedAt: new Date() },
    });
    return {
      message: 'Logged out successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });
    if (!user) {
      return {
        message:
          'If an account exists for this email, a password reset link has been sent.',
      };
    }
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 12);
    await this.prismaService.user.update({
      where: { email: forgotPasswordDto.email },
      data: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await this.mailService.sendPasswordResetEmail(forgotPasswordDto.email, resetToken);
    return {
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: resetPasswordDto.email },
    });
    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt <= new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or expired.');
    }

    const match = await bcrypt.compare(
      resetPasswordDto.token,
      user.passwordResetTokenHash,
    );

    if (!match) {
      throw new BadRequestException('Reset token is invalid or expired.');
    }
    const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, 12);
    await this.prismaService.user.update({
      where: { email: resetPasswordDto.email },
      data: {
        passwordHash: newPasswordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        refreshTokens: {
          deleteMany: {},
        },
      },
    });
    return {
      message: 'Password changed successfully.',
    };
  }
}
