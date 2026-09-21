import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DisputeStatus,
  EscrowStatus,
  NotificationType,
  OrderStatus,
  Role,
  TransactionType,
} from 'generated/prisma/enums';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class DisputeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, createDisputeDto: CreateDisputeDto) {
    const order = await this.prismaService.order.findUnique({
      where: { id: createDisputeDto.orderId },
    });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    if (userId !== order.clientId) {
      throw new ForbiddenException(
        'You are not authorized to create a dispute for this order',
      );
    }
    if (
      order.status !== OrderStatus.IN_PROGRESS &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'You can only create a dispute for orders that are in progress or delivered',
      );
    }
    const dispute = await this.prismaService.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          orderId: createDisputeDto.orderId,
          reason: createDisputeDto.reason,
          clientId: userId,
          status: DisputeStatus.OPEN,
        },
      });
      await tx.order.update({
        where: { id: createDisputeDto.orderId },
        data: { status: OrderStatus.DISPUTED },
      });
      await tx.auditLog.create({
        data: {
          action: 'DISPUTE_OPENED',
          userId,
          orderId: createDisputeDto.orderId,
          before: {
            orderStatus: order.status,
          },
          after: {
            orderStatus: OrderStatus.DISPUTED,
          },
        },
      });
      return dispute;
    });
    const admins = await this.prismaService.user.findMany({
      where: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      admins.map((admin) =>
        this.notificationService.enqueue(
          admin.id,
          NotificationType.DISPUTE_OPENED,
          'New dispute opened',
          `A new dispute has been opened for order ${createDisputeDto.orderId}.`,
        ),
      ),
    );
    return dispute;
  }

  async findAll() {
    const disputes = await this.prismaService.dispute.findMany({
      include: {
        order: true,
        client: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return disputes;
  }

  async resolve(
    disputeId: string,
    resolveDisputeDto: ResolveDisputeDto,
    adminId: string,
  ) {
    const dispute = await this.prismaService.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (
      dispute.status !== DisputeStatus.OPEN &&
      dispute.status !== DisputeStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException('Dispute has already been resolved');
    }

    const escrow = await this.prismaService.escrow.findUnique({
      where: { orderId: dispute.orderId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.HOLDING) {
      throw new BadRequestException('Escrow is not in HOLDING state');
    }

    const result = await this.prismaService.$transaction(async (tx) => {
      const isFreelancerResolution =
        resolveDisputeDto.resolution === 'RESOLVED_FREELANCER';

      const updated = await tx.dispute.updateMany({
        where: {
          id: disputeId,
          status: {
            in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
          },
        },
        data: {
          status: resolveDisputeDto.resolution,
          adminNote: resolveDisputeDto.adminNote,
          resolvedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Dispute has already been resolved');
      }

      if (isFreelancerResolution) {
        await tx.order.update({
          where: { id: dispute.orderId },
          data: {
            status: OrderStatus.COMPLETED,
          },
        });

        const escrowUpdate = await tx.escrow.updateMany({
          where: {
            orderId: dispute.orderId,
            status: EscrowStatus.HOLDING,
          },
          data: {
            status: EscrowStatus.RELEASED,
            releasedAt: new Date(),
          },
        });

        if (escrowUpdate.count === 0) {
          throw new BadRequestException('Escrow is not in HOLDING state');
        }

        const wallet = await tx.wallet.update({
          where: { userId: dispute.order.freelancerId },
          data: {
            balance: {
              increment: escrow.amount,
            },
          },
        });

        await tx.transaction.create({
          data: {
            orderId: dispute.orderId,
            amount: escrow.amount,
            type: TransactionType.ESCROW_RELEASE,
            walletId: wallet.id,
            description: `Escrow release for disputed order ${dispute.orderId}`,
          },
        });
      } else {
        await tx.order.update({
          where: { id: dispute.orderId },
          data: {
            status: OrderStatus.REFUNDED,
          },
        });

        const escrowUpdate = await tx.escrow.updateMany({
          where: {
            orderId: dispute.orderId,
            status: EscrowStatus.HOLDING,
          },
          data: {
            status: EscrowStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });

        if (escrowUpdate.count === 0) {
          throw new BadRequestException('Escrow is not in HOLDING state');
        }

        const wallet = await tx.wallet.update({
          where: { userId: dispute.order.clientId },
          data: {
            balance: {
              increment: escrow.amount,
            },
          },
        });

        await tx.transaction.create({
          data: {
            orderId: dispute.orderId,
            amount: escrow.amount,
            type: TransactionType.ESCROW_REFUND,
            walletId: wallet.id,
            description: `Escrow refund for disputed order ${dispute.orderId}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          orderId: dispute.orderId,
          action: 'DISPUTE_RESOLVED',
          before: {
            status: dispute.status,
          },
          after: {
            status: resolveDisputeDto.resolution,
          },
        },
      });

      return tx.dispute.findUnique({
        where: { id: disputeId },
      });
    });

    const recipientId =
      resolveDisputeDto.resolution === 'RESOLVED_FREELANCER'
        ? dispute.order.freelancerId
        : dispute.order.clientId;

    await this.notificationService.enqueue(
      recipientId,
      NotificationType.DISPUTE_RESOLVED,
      'Dispute resolved',
      `The dispute for order ${dispute.orderId} has been resolved.`,
    );

    return result;
  }
}
