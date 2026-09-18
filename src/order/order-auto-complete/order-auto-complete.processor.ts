import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EscrowStatus,
  OrderStatus,
  TransactionType,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('ORDER_AUTO_COMPLETE')
export class OrderAutoCompleteProcessor extends WorkerHost {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'auto-complete-order') {
      return;
    }
    const { orderId } = job.data;

    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (
      !order ||
      order.status !== OrderStatus.DELIVERED ||
      (order.autoCompleteAt && order.autoCompleteAt > new Date())
    ) {
      return;
    }
    await this.prismaService.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.DELIVERED,
        },
        data: {
          status: OrderStatus.COMPLETED,
        },
      });

      if (updated.count === 0) {
        return;
      }

      const escrow = await tx.escrow.updateMany({
        where: {
          orderId,
          status: EscrowStatus.HOLDING,
        },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      if (escrow.count === 0) {
        throw new Error('Escrow is not in HOLDING state');
      }
      const freelancerWallet = await tx.wallet.update({
        where: { userId: order.freelancerId },
        data: { balance: { increment: order.price } },
      });
      await tx.transaction.create({
        data: {
          orderId,
          amount: order.price,
          type: TransactionType.ESCROW_RELEASE,
          walletId: freelancerWallet.id,
          description: `Escrow release for order ${order.id}`,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: null,
          orderId,
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.DELIVERED },
          after: { status: OrderStatus.COMPLETED },
        },
      });
    });
  }
}
