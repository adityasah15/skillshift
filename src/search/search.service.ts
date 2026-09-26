import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { SearchServicesDto } from './dto/search-services.dto';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async searchServices(dto: SearchServicesDto) {
    const key = `search:services:${JSON.stringify(dto)}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const q = dto.q?.trim();
    const skills = dto.skills?.filter(Boolean);
    const limit = dto.limit ?? 20;

    const searchCondition = q
      ? Prisma.sql`
        AND "searchVector" @@ plainto_tsquery('english', ${q})
      `
      : Prisma.empty;

    const skillsCondition =
      skills && skills.length > 0
        ? Prisma.sql`
          AND "skills" @> ${skills}::text[]
        `
        : Prisma.empty;

    const minPriceCondition =
      dto.minPrice !== undefined
        ? Prisma.sql`
          AND "price" >= ${dto.minPrice}
        `
        : Prisma.empty;

    const maxPriceCondition =
      dto.maxPrice !== undefined
        ? Prisma.sql`
          AND "price" <= ${dto.maxPrice}
        `
        : Prisma.empty;

    const cursorCondition = dto.cursor
      ? Prisma.sql`
        AND "id" < ${dto.cursor}
      `
      : Prisma.empty;

    const services = await this.prisma.$queryRaw<
      Array<{
        id: string;
        freelancerId: string;
        title: string;
        description: string;
        price: number;
        skills: string[];
        imageUrls: string[];
        status: string;
        createdAt: Date;
      }>
    >`
    SELECT
      id,
      "freelancerId",
      title,
      description,
      price,
      skills,
      "imageUrls",
      status,
      "createdAt"
    FROM "Service"
    WHERE "deletedAt" IS NULL
      AND "status" = 'ACTIVE'
      ${searchCondition}
      ${skillsCondition}
      ${minPriceCondition}
      ${maxPriceCondition}
      ${cursorCondition}
    ORDER BY "createdAt" DESC, "id" DESC
    LIMIT ${limit + 1}
  `;

    const hasMore = services.length > limit;

    if (hasMore) {
      services.pop();
    }

    const cursor =
      services.length > 0 ? services[services.length - 1].id : null;

    const response = {
      data: services,
      meta: {
        cursor,
        hasMore,
      },
    };

    await this.redisService.set(key, JSON.stringify(response), 120);

    return response;
  }
}
