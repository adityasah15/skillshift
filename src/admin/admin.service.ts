import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getAnalytics() {
    const cacheKey = 'admin:analytics:dashboard';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
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
        : Number(
            ((totalDisputes / totalOrders) * 100).toFixed(2),
          );

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

    await this.redisService.set(
      cacheKey,
      JSON.stringify(result),
      60,
    );

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

async moderateService(
  serviceId: string,
  status: 'ACTIVE' | 'REJECTED',
) {
  const service = await this.prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      status: true,
      deletedAt: true,
    },
  });

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  return this.prisma.service.update({
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
}
}