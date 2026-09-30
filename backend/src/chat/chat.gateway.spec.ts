import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { NotificationService } from 'src/notification/notification.service';
import { WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  const chatService = {
    assertOrderParticipant: jest.fn(),
    saveMessage: jest.fn(),
    getOrderParticipants: jest.fn(),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const redisService = {
    trackPresence: jest.fn(),
    removePresence: jest.fn(),
    incrWithTtl: jest.fn(),
  };
  const notificationService = {
    enqueue: jest.fn(),
  };
  const roomEmitter = { emit: jest.fn() };
  const server = {
    emit: jest.fn(),
    to: jest.fn().mockReturnValue(roomEmitter),
  };
  const user: JwtPayload = {
    sub: 'user-1',
    email: 'user@example.com',
    role: 'CLIENT',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatService },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redisService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = server as unknown as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('validates a Bearer-prefixed token and announces first presence', async () => {
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'Bearer signed.jwt.token' } },
      disconnect: jest.fn(),
    } as unknown as Parameters<ChatGateway['handleConnection']>[0];
    jwtService.verifyAsync.mockResolvedValue(user);
    redisService.trackPresence.mockResolvedValue(true);

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('signed.jwt.token');
    expect(redisService.trackPresence).toHaveBeenCalledWith(
      'user-1',
      'socket-1',
      30,
    );
    expect(server.emit).toHaveBeenCalledWith('user_online', {
      userId: 'user-1',
    });
  });

  it('rejects a raw handshake token', async () => {
    const disconnect = jest.fn();
    const client = {
      id: 'socket-1',
      handshake: { auth: { token: 'signed.jwt.token' } },
      disconnect,
    } as unknown as Parameters<ChatGateway['handleConnection']>[0];

    await gateway.handleConnection(client);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(redisService.trackPresence).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });

  it('refreshes presence on ping without announcing duplicate online events', async () => {
    redisService.trackPresence.mockResolvedValue(false);
    const client = {
      id: 'socket-1',
      user,
    } as unknown as Parameters<ChatGateway['handlePing']>[0];

    await gateway.handlePing(client);

    expect(redisService.trackPresence).toHaveBeenCalledWith(
      'user-1',
      'socket-1',
      30,
    );
    expect(server.emit).not.toHaveBeenCalled();
  });

  it('announces offline only when the last socket disconnects', async () => {
    redisService.removePresence.mockResolvedValue(false);
    const firstClient = {
      id: 'socket-1',
      user,
    } as unknown as Parameters<ChatGateway['handleDisconnect']>[0];

    await gateway.handleDisconnect(firstClient);
    expect(server.emit).not.toHaveBeenCalled();

    redisService.removePresence.mockResolvedValue(true);
    const lastClient = {
      id: 'socket-2',
      user,
    } as unknown as Parameters<ChatGateway['handleDisconnect']>[0];
    await gateway.handleDisconnect(lastClient);

    expect(server.emit).toHaveBeenCalledWith('user_offline', {
      userId: 'user-1',
    });
  });

  it('allows 30 messages per minute and rejects the next message', async () => {
    redisService.incrWithTtl
      .mockResolvedValueOnce(30)
      .mockResolvedValueOnce(31);
    chatService.saveMessage.mockResolvedValue({ id: 'message-1' });
    chatService.getOrderParticipants.mockResolvedValue({
      clientId: 'user-1',
      freelancerId: 'freelancer-1',
    });
    const client = {
      id: 'socket-1',
      user,
    } as unknown as Parameters<ChatGateway['handleSendMessage']>[0];
    const data = {
      orderId: 'order-1',
      content: 'Hello',
    };

    await expect(gateway.handleSendMessage(client, data)).resolves.toEqual({
      id: 'message-1',
    });
    await expect(
      gateway.handleSendMessage(client, data),
    ).rejects.toBeInstanceOf(WsException);

    expect(redisService.incrWithTtl).toHaveBeenNthCalledWith(
      1,
      'chat:rate:user-1',
      60,
    );
    expect(chatService.saveMessage).toHaveBeenCalledTimes(1);
  });
});
