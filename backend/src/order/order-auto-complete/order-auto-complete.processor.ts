import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  EscrowStatus,
  NotificationType,
  OrderStatus,
  TransactionType,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Processor('ORDER_AUTO_COMPLETE')
export class OrderAutoCompleteProcessor extends WorkerHost {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>) {
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
    const completed = await this.prismaService.$transaction(async (tx) => {
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
        return false;
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
      return true;
    });

    if (!completed) {
      return;
    }

    await this.redisService.del('admin:analytics:dashboard');
    await this.notificationService.enqueue(
      order.freelancerId,
      NotificationType.ORDER_COMPLETED,
      'Order completed',
      'Your order has been completed and payment has been released.',
      order.id,
    );
  }
}
