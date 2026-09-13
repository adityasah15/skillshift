import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { profile } from 'console';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

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
    return this.prismaService.profile.update({
      where: { userId: userId },
      data: updateProfileDto,
    });
  }

  async getPublicProfile(userId: string) {
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

    return profile;
  }
}
