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
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

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
        const refreshToken = randomBytes(32).toString('hex');
        const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
        await this.prismaService.refreshToken.create({
          data: {
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
    const tokens = await this.prismaService.refreshToken.findMany({
      where: {
        revokedAt: null,
      },
    });
    let matchedToken: (typeof tokens)[number] | null = null;

    for (const token of tokens) {
      const match = await bcrypt.compare(refreshToken, token.tokenHash);

      if (match) {
        matchedToken = token;
        break;
      }
    }
    if (!matchedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (matchedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
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

    const newRefreshToken = randomBytes(32).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() },
      });

      await tx.refreshToken.create({
        data: {
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
  
}
