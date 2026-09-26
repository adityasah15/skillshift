import { Test, TestingModule } from '@nestjs/testing';
import { EscrowService } from './escrow.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('EscrowService', () => {
  let service: EscrowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});