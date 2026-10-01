import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  NotificationType,
  OrderStatus,
  ServiceStatus,
  TransactionType,
} from 'generated/prisma/enums';
import { EscrowService } from 'src/escrow/escrow.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly escrowService: EscrowService,
    @InjectQueue('ORDER_AUTO_COMPLETE')
    private readonly autoCompleteQueue: Queue,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  async create(clientId: string, createOrderDto: CreateOrderDto) {
    const service = await this.prismaService.service.findUnique({
      where: { id: createOrderDto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.deletedAt !== null) {
      throw new BadRequestException('Service is deleted');
    }
    if (service.status !== ServiceStatus.ACTIVE) {
      throw new BadRequestException('Service is not active');
    }
    if (service.freelancerId === clientId) {
      throw new BadRequestException('You cannot order your own service');
    }
    const wallet = await this.prismaService.wallet.findUnique({
      where: { userId: clientId },
    });
    if (!wallet || wallet.balance < service.price) {
      throw new BadRequestException('Insufficient balance');
    }
    const order = await this.prismaService.$transaction(async (tx) => {
      const debit = await tx.wallet.updateMany({
        where: { userId: clientId, balance: { gte: service.price } },
        data: { balance: { decrement: service.price } },
      });
      if (debit.count !== 1) {
        throw new BadRequestException('Insufficient balance');
      }
      const order = await tx.order.create({
        data: {
          clientId,
          freelancerId: service.freelancerId,
          serviceId: service.id,
          price: service.price,
          deliveryDays: service.deliveryDays,
          requirements: createOrderDto.requirements,
          status: OrderStatus.IN_PROGRESS,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: clientId,
          orderId: order.id,
          action: 'ORDER_STATUS_CHANGED',
          before: { status: null },
          after: { status: OrderStatus.IN_PROGRESS },
        },
      });
      await tx.transaction.create({
        data: {
          orderId: order.id,
          amount: service.price,
          type: TransactionType.ESCROW_HOLD,
          walletId: wallet.id,
          description: `Escrow hold for order ${order.id}`,
        },
      });
      await this.escrowService.hold(tx, service.price, order.id);
      return order;
    });

    await this.redisService.del('admin:analytics:dashboard');
    await this.notificationService.enqueue(
      order.freelancerId,
      NotificationType.ORDER_PLACED,
      'New order received',
      'You have received a new order.',
      order.id,
    );

    return order;
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { deliveryFiles: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== userId && order.freelancerId !== userId) {
      throw new ForbiddenException('You are not allowed to view this order');
    }
    return order;
  }

  async listForUser(userId: string) {
    const orders = await this.prismaService.order.findMany({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
      include: {
        service: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      price: order.price,
      createdAt: order.createdAt,
      serviceTitle: order.service.title,
      roleLabel:
        order.clientId === userId ? 'Client order' : 'Freelancer order',
    }));
  }

  async deliver(freelancerId: string, orderId: string, deliveryNote: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.freelancerId !== freelancerId) {
      throw new ForbiddenException('You are not allowed to deliver this order');
    }
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Order is not in progress');
    }
    const updatedOrder = await this.prismaService.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          deliveryNote,
          autoCompleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.auditLog.create({
        data: {
          userId: freelancerId,
          orderId,
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.IN_PROGRESS },
          after: { status: OrderStatus.DELIVERED },
        },
      });
      return updatedOrder;
    });

    await this.redisService.del('admin:analytics:dashboard');
    await this.notificationService.enqueue(
      order.clientId,
      NotificationType.ORDER_DELIVERED,
      'Order delivered',
      'Your order has been delivered.',
      order.id,
    );

    await this.autoCompleteQueue.add(
      'auto-complete-order',
      { orderId: updatedOrder.id },
      {
        delay: 7 * 24 * 60 * 60 * 1000,
        jobId: `order-${updatedOrder.id}`,
      },
    );
    return updatedOrder;
  }

  async complete(clientId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.clientId !== clientId) {
      throw new ForbiddenException(
        'You are not allowed to complete this order',
      );
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order is not delivered yet');
    }
    const updatedOrder = await this.prismaService.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED },
      });
      await tx.auditLog.create({
        data: {
          userId: clientId,
          orderId,
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.DELIVERED },
          after: { status: OrderStatus.COMPLETED },
        },
      });
      await this.escrowService.release(tx, order.id);
      const freelancerWallet = await tx.wallet.findUnique({
        where: { userId: order.freelancerId },
      });
      if (!freelancerWallet) {
        throw new NotFoundException('Freelancer wallet not found');
      }
      await tx.wallet.update({
        where: { userId: order.freelancerId },
        data: {
          balance: { increment: order.price },
        },
      });
      await tx.transaction.create({
        data: {
          orderId: order.id,
          amount: order.price,
          type: TransactionType.ESCROW_RELEASE,
          walletId: freelancerWallet.id,
          description: `Escrow release for order ${order.id}`,
        },
      });
      return order;
    });

    await this.redisService.del('admin:analytics:dashboard');
    await this.notificationService.enqueue(
      updatedOrder.freelancerId,
      NotificationType.ORDER_COMPLETED,
      'Order completed',
      'Your order has been completed and payment has been released.',
      updatedOrder.id,
    );

    return updatedOrder;
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.clientId !== userId && order.freelancerId !== userId) {
      throw new ForbiddenException('You are not allowed to cancel this order');
    }
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('Order is not in progress');
    }
    const updatedOrder = await this.prismaService.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.auditLog.create({
        data: {
          userId,
          orderId,
          action: 'ORDER_STATUS_CHANGED',
          before: { status: OrderStatus.IN_PROGRESS },
          after: { status: OrderStatus.CANCELLED },
        },
      });
      await this.escrowService.refund(tx, order.id);
      const clientWallet = await tx.wallet.findUnique({
        where: { userId: order.clientId },
      });
      if (!clientWallet) {
        throw new NotFoundException('Client wallet not found');
      }
      await tx.wallet.update({
        where: { userId: order.clientId },
        data: {
          balance: { increment: order.price },
        },
      });
      await tx.transaction.create({
        data: {
          orderId: order.id,
          amount: order.price,
          type: TransactionType.ESCROW_REFUND,
          walletId: clientWallet.id,
          description: `Escrow refund for order ${order.id}`,
        },
      });
      return order;
    });

    await this.redisService.del('admin:analytics:dashboard');
    await Promise.all(
      [order.clientId, order.freelancerId].map((recipientId) =>
        this.notificationService.enqueue(
          recipientId,
          NotificationType.ORDER_CANCELLED,
          'Order cancelled',
          'An order you were involved in has been cancelled and the payment has been refunded.',
          order.id,
        ),
      ),
    );

    return updatedOrder;
  }
}
