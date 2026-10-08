import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async listUsers() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listServices() {
    return this.prisma.service.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        deliveryDays: true,
        skills: true,
        imageUrls: true,
        status: true,
        createdAt: true,
        freelancer: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listOrders() {
    return this.prisma.order.findMany({
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
        service: { select: { title: true } },
        client: { select: { email: true } },
        freelancer: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getAnalytics() {
    const cacheKey = 'admin:analytics:dashboard';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    const [
      ordersByStatus,
      revenueResult,
      topFreelancers,
      totalOrders,
      totalDisputes,
      newUsersPerDay,
    ] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      }),

      this.prisma.escrow.aggregate({
        where: {
          status: 'RELEASED',
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.user.findMany({
        where: {
          role: 'FREELANCER',
          deletedAt: null,
          profile: {
            isNot: null,
          },
        },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
              rating: true,
              totalReviews: true,
            },
          },
        },
        orderBy: {
          profile: {
            rating: 'desc',
          },
        },
        take: 10,
      }),

      this.prisma.order.count(),

      this.prisma.dispute.count(),

      this.prisma.$queryRaw<
        Array<{
          date: Date;
          count: bigint;
        }>
      >(Prisma.sql`
        SELECT
          DATE("createdAt") AS date,
          COUNT(*)::bigint AS count
        FROM "User"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '29 days'
          AND "deletedAt" IS NULL
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `),
    ]);

    const disputeRate =
      totalOrders === 0
        ? 0
        : Number(((totalDisputes / totalOrders) * 100).toFixed(2));

    const result = {
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),

      revenue: revenueResult._sum.amount ?? 0,

      topFreelancers,

      disputeRate,

      newUsersPerDay: newUsersPerDay.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), 60);

    return result;
  }

  async manageUser(userId: string, action: 'disable' | 'enable') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException(
        'Admin users cannot be managed through this endpoint',
      );
    }

    const deletedAt = action === 'disable' ? new Date() : null;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        deletedAt: true,
      },
    });
  }

  async moderateService(serviceId: string, status: 'ACTIVE' | 'REJECTED') {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!service || service.deletedAt) {
      throw new NotFoundException('Service not found');
    }

    const moderatedService = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        status,
      },
      select: {
        id: true,
        title: true,
        status: true,
        deletedAt: true,
      },
    });
    await this.redisService.del(`service:v2:${serviceId}`);
    await this.redisService.delByPattern('services:*');
    await this.redisService.delByPattern('search:services:*');
    return moderatedService;
  }
}
