import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            skills: true,
            portfolioUrls: true,
            rating: true,
            totalReviews: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const profile = await this.prismaService.profile.update({
      where: { userId: userId },
      data: updateProfileDto,
    });
    await this.redisService.del(`profiles:freelancer:${userId}`);
    return profile;
  }

  async getPublicProfile(userId: string) {
    const cacheKey = `profiles:freelancer:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    const profile = await this.prismaService.profile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        bio: true,
        avatarUrl: true,
        skills: true,
        portfolioUrls: true,
        rating: true,
        totalReviews: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.redisService.set(cacheKey, JSON.stringify(profile), 600);
    return profile;
  }
}
