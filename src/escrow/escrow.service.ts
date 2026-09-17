import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EscrowStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class EscrowService {
  constructor(private readonly prismaService: PrismaService) {}

  async hold(tx: Prisma.TransactionClient, amount: number, orderId: string) {
    return tx.escrow.create({
      data: {
        amount,
        orderId,
      },
    });
  }

  async release(tx: Prisma.TransactionClient, orderId: string) {
    const escrow = await tx.escrow.findUnique({
  where: { orderId },
});
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }
    if (escrow.status !== EscrowStatus.HOLDING) {
      throw new BadRequestException('Escrow already resolved');
    }
    return tx.escrow.update({
      where: { orderId },
      data: { status: EscrowStatus.RELEASED, releasedAt: new Date() },
    });
  }

  async refund(tx: Prisma.TransactionClient, orderId: string) {
    const escrow = await tx.escrow.findUnique({
      where: { orderId },
    });
    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }
    if (escrow.status !== EscrowStatus.HOLDING) {
      throw new BadRequestException('Escrow already resolved');
    }
    return tx.escrow.update({
      where: { orderId },
      data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
    });
  }
}
