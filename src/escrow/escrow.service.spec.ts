import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { EscrowService } from './escrow.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EscrowStatus } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

describe('EscrowService', () => {
  let service: EscrowService;

  const tx = {
    escrow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('hold', () => {
    it('should create an escrow holding', async () => {
      const escrow = {
        id: 'escrow-1',
        amount: 100,
        orderId: 'order-1',
        status: EscrowStatus.HOLDING,
      };

      tx.escrow.create.mockResolvedValue(escrow);

      const result = await service.hold(
        tx as unknown as Prisma.TransactionClient,
        100,
        'order-1',
      );

      expect(tx.escrow.create).toHaveBeenCalledWith({
        data: {
          amount: 100,
          orderId: 'order-1',
        },
      });

      expect(result).toEqual(escrow);
    });
  });

  describe('release', () => {
    it('should throw when escrow does not exist', async () => {
      tx.escrow.findUnique.mockResolvedValue(null);

      await expect(
        service.release(tx as unknown as Prisma.TransactionClient, 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.escrow.findUnique).toHaveBeenCalledWith({
        where: {
          orderId: 'order-1',
        },
      });

      expect(tx.escrow.update).not.toHaveBeenCalled();
    });

    it('should throw when escrow is already resolved', async () => {
      tx.escrow.findUnique.mockResolvedValue({
        id: 'escrow-1',
        orderId: 'order-1',
        status: EscrowStatus.RELEASED,
      });

      await expect(
        service.release(tx as unknown as Prisma.TransactionClient, 'order-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tx.escrow.update).not.toHaveBeenCalled();
    });

    it('should release a holding escrow', async () => {
      const escrow = {
        id: 'escrow-1',
        orderId: 'order-1',
        status: EscrowStatus.HOLDING,
      };

      const releasedEscrow = {
        ...escrow,
        status: EscrowStatus.RELEASED,
        releasedAt: new Date(),
      };

      tx.escrow.findUnique.mockResolvedValue(escrow);
      tx.escrow.update.mockResolvedValue(releasedEscrow);

      const result = await service.release(
        tx as unknown as Prisma.TransactionClient,
        'order-1',
      );

      expect(tx.escrow.update).toHaveBeenCalledWith({
        where: {
          orderId: 'order-1',
        },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: expect.any(Date) as unknown,
        },
      });

      expect(result).toEqual(releasedEscrow);
    });
  });

  describe('refund', () => {
    it('should throw when escrow does not exist', async () => {
      tx.escrow.findUnique.mockResolvedValue(null);

      await expect(
        service.refund(tx as unknown as Prisma.TransactionClient, 'order-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(tx.escrow.findUnique).toHaveBeenCalledWith({
        where: {
          orderId: 'order-1',
        },
      });

      expect(tx.escrow.update).not.toHaveBeenCalled();
    });

    it('should throw when escrow is already resolved', async () => {
      tx.escrow.findUnique.mockResolvedValue({
        id: 'escrow-1',
        orderId: 'order-1',
        status: EscrowStatus.REFUNDED,
      });

      await expect(
        service.refund(tx as unknown as Prisma.TransactionClient, 'order-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(tx.escrow.update).not.toHaveBeenCalled();
    });

    it('should refund a holding escrow', async () => {
      const escrow = {
        id: 'escrow-1',
        orderId: 'order-1',
        status: EscrowStatus.HOLDING,
      };

      const refundedEscrow = {
        ...escrow,
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date(),
      };

      tx.escrow.findUnique.mockResolvedValue(escrow);
      tx.escrow.update.mockResolvedValue(refundedEscrow);

      const result = await service.refund(
        tx as unknown as Prisma.TransactionClient,
        'order-1',
      );

      expect(tx.escrow.update).toHaveBeenCalledWith({
        where: {
          orderId: 'order-1',
        },
        data: {
          status: EscrowStatus.REFUNDED,
          refundedAt: expect.any(Date) as unknown,
        },
      });

      expect(result).toEqual(refundedEscrow);
    });
  });
});
