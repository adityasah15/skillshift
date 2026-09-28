import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { SearchServicesDto } from './dto/search-services.dto';

type SearchCursor = {
  createdAt: string;
  id: string;
};

type SearchServiceRecord = {
  id: string;
  freelancerId: string;
  title: string;
  description: string;
  price: number;
  skills: string[];
  imageUrls: string[];
  status: string;
  createdAt: Date;
};

type SearchResponse = {
  data: SearchServiceRecord[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
};

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private encodeCursor(cursor: SearchCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodeCursor(cursor: string): SearchCursor {
    try {
      const decoded: unknown = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      );

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        typeof (decoded as SearchCursor).createdAt !== 'string' ||
        typeof (decoded as SearchCursor).id !== 'string'
      ) {
        throw new Error('Invalid cursor shape');
      }

      const createdAt = new Date((decoded as SearchCursor).createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor timestamp');
      }

      return {
        createdAt: createdAt.toISOString(),
        id: (decoded as SearchCursor).id,
      };
    } catch {
      throw new BadRequestException('Invalid search cursor');
    }
  }

  async searchServices(dto: SearchServicesDto): Promise<SearchResponse> {
    const key = `search:services:${JSON.stringify(dto)}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached) as SearchResponse;
    }

    const q = dto.q?.trim();
    const skills = dto.skills?.filter(Boolean);
    const limit = dto.limit ?? 20;

    const decodedCursor = dto.cursor
      ? this.decodeCursor(dto.cursor)
      : undefined;

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

    const cursorCondition = decodedCursor
      ? Prisma.sql`
        AND (
          "createdAt" < ${decodedCursor.createdAt}
          OR (
            "createdAt" = ${decodedCursor.createdAt}
            AND "id" < ${decodedCursor.id}
          )
        )
      `
      : Prisma.empty;

    const services = await this.prisma.$queryRaw<SearchServiceRecord[]>`
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

    const lastService = services[services.length - 1];

    const cursor = lastService
      ? this.encodeCursor({
          createdAt: lastService.createdAt.toISOString(),
          id: lastService.id,
        })
      : null;

    const response: SearchResponse = {
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
