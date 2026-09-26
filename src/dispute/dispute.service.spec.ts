import { Test, TestingModule } from '@nestjs/testing';
import { DisputeService } from './dispute.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

describe('DisputeService', () => {
  let service: DisputeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});