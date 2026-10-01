import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'generated/prisma/enums';
import { validate } from 'class-validator';
import { SendMessageEventDto } from './dto/send-message-event.dto';

describe('ChatService', () => {
  let service: ChatService;
  const prisma = {
    order: { findUnique: jest.fn() },
    conversation: { upsert: jest.fn(), findUnique: jest.fn() },
    message: { create: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each([
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ])('rejects new messages for %s orders', async (status) => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      status,
    });

    await expect(
      service.saveMessage('order-1', 'client-1', 'Hello'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.conversation.upsert).not.toHaveBeenCalled();
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  it.each([
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ])('allows history reads for %s orders', async (status) => {
    const messages = [{ id: 'message-1', content: 'Previous message' }];
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      status,
    });
    prisma.conversation.findUnique.mockResolvedValue({ id: 'conversation-1' });
    prisma.message.findMany.mockResolvedValue(messages);

    await expect(service.getMessages('order-1', 'client-1')).resolves.toEqual({
      messages,
      nextCursor: null,
    });
  });

  it('allows participants to continue messaging on disputed orders', async () => {
    const message = { id: 'message-1', content: 'Let us resolve this' };
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      clientId: 'client-1',
      freelancerId: 'freelancer-1',
      status: OrderStatus.DISPUTED,
    });
    prisma.conversation.upsert.mockResolvedValue({ id: 'conversation-1' });
    prisma.message.create.mockResolvedValue(message);

    await expect(
      service.saveMessage('order-1', 'client-1', message.content),
    ).resolves.toBe(message);
  });

  it('enforces the 2000-character message limit', async () => {
    const dto = Object.assign(new SendMessageEventDto(), {
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      content: 'x'.repeat(2001),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('content');
  });
});
