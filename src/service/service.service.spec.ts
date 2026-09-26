import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';

describe('ServiceService', () => {
  let service: ServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: RedisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});