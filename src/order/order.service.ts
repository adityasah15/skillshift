import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderStatus,
  ServiceStatus,
  TransactionType,
} from 'generated/prisma/enums';
import { EscrowService } from 'src/escrow/escrow.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly escrowService: EscrowService,
    @InjectQueue('ORDER_AUTO_COMPLETE')
    private readonly autoCompleteQueue: Queue,
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
      await tx.wallet.update({
        where: { userId: clientId },
        data: { balance: { decrement: service.price } },
      });
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
    return order;
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.clientId !== userId && order.freelancerId !== userId) {
      throw new ForbiddenException('You are not allowed to view this order');
    }

    return order;
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
    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveryNote,
        autoCompleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
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
    return updatedOrder;
  }
}
