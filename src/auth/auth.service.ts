import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
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
}
