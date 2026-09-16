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
    return this.prismaService.service.create({
      data: {
        ...createServiceDto,
        freelancerId: userId,
      },
    });
  }
  async findAll(serviceQueryDto: ServiceQueryDto) {
    const key = `services:${JSON.stringify(serviceQueryDto)}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const limit = serviceQueryDto.limit ?? 20;
    const services = await this.prismaService.service.findMany({
      where: {
        deletedAt: null,
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
    await this.redisService.set(key, JSON.stringify(response), 3600); // Cache for 1 hour
    return response;
  }

  async findOne(serviceId: string) {
    const key = `service:${serviceId}`;

    const cached = await this.redisService.get(key);

    if (cached) {
      return JSON.parse(cached);
    }
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        deletedAt: null,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }
    await this.redisService.set(key, JSON.stringify(service), 3600); // Cache for 1 hour

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
    await this.redisService.del(`service:${serviceId}`);
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
    await this.redisService.del(`service:${serviceId}`);
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
    await this.redisService.del(`service:${serviceId}`);
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
    await this.redisService.del(`service:${serviceId}`);
    return rejectedService;
  }
}
