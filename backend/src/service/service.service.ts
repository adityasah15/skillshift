import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { RedisService } from 'src/redis/redis.service';
import { ServiceStatus } from 'generated/prisma/enums';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(userId: string, createServiceDto: CreateServiceDto) {
    const service = await this.prismaService.service.create({
      data: {
        ...createServiceDto,
        freelancerId: userId,
      },
    });
    await this.redisService.delByPattern('services:*'); // Invalidate the cache for all services
    await this.redisService.delByPattern('search:services:*');
    return service;
  }
  async findAll(serviceQueryDto: ServiceQueryDto) {
    const key = `services:v2:${JSON.stringify(serviceQueryDto)}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached) as unknown;
    }

    const limit = serviceQueryDto.limit ?? 20;
    const services = await this.prismaService.service.findMany({
      where: {
        deletedAt: null,
        status: ServiceStatus.ACTIVE,
        ...(serviceQueryDto.skills?.length && {
          skills: {
            hasEvery: serviceQueryDto.skills,
          },
        }),
        price: {
          ...(serviceQueryDto.minPrice !== undefined && {
            gte: serviceQueryDto.minPrice,
          }),
          ...(serviceQueryDto.maxPrice !== undefined && {
            lte: serviceQueryDto.maxPrice,
          }),
        },
      },
      ...(serviceQueryDto.cursor
        ? { cursor: { id: serviceQueryDto.cursor }, skip: 1 }
        : {}),
      take: limit + 1,

      orderBy: {
        createdAt: 'desc',
      },
    });
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
    await this.redisService.set(key, JSON.stringify(response), 300);
    return response;
  }

  async findMine(userId: string) {
    return this.prismaService.service.findMany({
      where: { freelancerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(serviceId: string) {
    const key = `service:v2:${serviceId}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached) as unknown;
    }
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
        status: ServiceStatus.ACTIVE,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    await this.redisService.set(key, JSON.stringify(service), 600);

    return service;
  }

  async update(
    userId: string,
    updateServiceDto: UpdateServiceDto,
    serviceId: string,
  ) {
    const service = await this.prismaService.service.findFirst({
      where: {
        freelancerId: userId,
        id: serviceId,
        deletedAt: null,
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    const updatedService = await this.prismaService.service.update({
      where: { id: service.id },
      data: updateServiceDto,
    });
    // Invalidate the cache for this service
    await this.redisService.del(`service:v2:${serviceId}`);
    await this.redisService.delByPattern('services:*'); // Invalidate the cache for all services
    await this.redisService.delByPattern('search:services:*');
    return updatedService;
  }

  async delete(userId: string, serviceId: string) {
    const service = await this.prismaService.service.findFirst({
      where: {
        freelancerId: userId,
        id: serviceId,
        deletedAt: null,
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    const deletedService = await this.prismaService.service.update({
      where: { id: service.id },
      data: { deletedAt: new Date() },
    });
    // Invalidate the cache for this service
    await this.redisService.del(`service:v2:${serviceId}`);
    await this.redisService.delByPattern('services:*'); // Invalidate the cache for all services
    await this.redisService.delByPattern('search:services:*');
    return deletedService;
  }

  async approve(serviceId: string) {
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    const approvedService = await this.prismaService.service.update({
      where: { id: service.id },
      data: { status: ServiceStatus.ACTIVE },
    });
    // Invalidate the cache for this service
    await this.redisService.del(`service:v2:${serviceId}`);
    await this.redisService.delByPattern('services:*'); // Invalidate the cache for all services
    await this.redisService.delByPattern('search:services:*');
    return approvedService;
  }

  async reject(serviceId: string) {
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    const rejectedService = await this.prismaService.service.update({
      where: { id: service.id },
      data: { status: ServiceStatus.REJECTED },
    });
    // Invalidate the cache for this service
    await this.redisService.del(`service:v2:${serviceId}`);
    await this.redisService.delByPattern('services:*'); // Invalidate the cache for all services
    await this.redisService.delByPattern('search:services:*');
    return rejectedService;
  }
}
