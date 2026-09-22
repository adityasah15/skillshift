import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(orderId: string, senderId: string, content: string) {
    const order = await this.assertOrderParticipant(orderId, senderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isParticipant =
      order.clientId === senderId || order.freelancerId === senderId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    const conversation = await this.prisma.conversation.upsert({
      where: { orderId },
      create: { orderId },
      update: {},
    });

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content,
      },
    });
  }

  async getMessages(
    orderId: string,
    userId: string,
    cursor?: string,
    limit = 20,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        clientId: true,
        freelancerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isParticipant =
      order.clientId === userId || order.freelancerId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { orderId },
      select: { id: true },
    });

    if (!conversation) {
      return {
        messages: [],
        nextCursor: null,
      };
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    return {
      messages,
      nextCursor: hasMore ? (messages[messages.length - 1]?.id ?? null) : null,
    };
  }

  async assertOrderParticipant(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        clientId: true,
        freelancerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isParticipant =
      order.clientId === userId || order.freelancerId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this order');
    }

    return order;
  }

  async getOrderParticipants(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        clientId: true,
        freelancerId: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
