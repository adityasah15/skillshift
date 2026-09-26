import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { OrderService } from './order.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EscrowService } from 'src/escrow/escrow.service';
import { NotificationService } from 'src/notification/notification.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: EscrowService,
          useValue: {},
        },
        {
          provide: getQueueToken('ORDER_AUTO_COMPLETE'),
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});