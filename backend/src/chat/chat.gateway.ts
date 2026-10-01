import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ChatService } from './chat.service';
import { SendMessageEventDto } from './dto/send-message-event.dto';
import { ValidationPipe, UsePipes } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { NotificationType } from 'generated/prisma/enums';
import { NotificationService } from '../notification/notification.service';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: process.env.FRONTEND_URL },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly presenceTtlSeconds = 30;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const authorization: unknown = client.handshake.auth?.token;

      if (typeof authorization !== 'string') {
        throw new WsException('Authentication required');
      }
      const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
      if (!match) {
        throw new WsException('Authentication required');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(match[1]);

      client.user = payload;

      const becameOnline = await this.redisService.trackPresence(
        payload.sub,
        client.id,
        this.presenceTtlSeconds,
      );
      if (becameOnline) {
        this.server.emit('user_online', { userId: payload.sub });
      }
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) {
      return;
    }

    const becameOffline = await this.redisService.removePresence(
      client.user.sub,
      client.id,
    );
    if (becameOffline) {
      this.server.emit('user_offline', { userId: client.user.sub });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    const becameOnline = await this.redisService.trackPresence(
      client.user.sub,
      client.id,
      this.presenceTtlSeconds,
    );
    if (becameOnline) {
      this.server.emit('user_online', { userId: client.user.sub });
    }
  }

  @SubscribeMessage('join_order')
  async handleJoinOrder(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    await this.chatService.assertOrderParticipant(
      data.orderId,
      client.user.sub,
    );

    await client.join(`order-${data.orderId}`);

    return {
      event: 'joined_order',
      orderId: data.orderId,
    };
  }
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageEventDto,
  ) {
    const key = `chat:rate:${client.user.sub}`;

    const count = await this.redisService.incrWithTtl(key, 60);

    if (count > 30) {
      throw new WsException('Too many messages. Please slow down.');
    }

    const message = await this.chatService.saveMessage(
      data.orderId,
      client.user.sub,
      data.content,
    );

    const order = await this.chatService.getOrderParticipants(data.orderId);

    const recipientId =
      order.clientId === client.user.sub ? order.freelancerId : order.clientId;

    await this.notificationService.enqueue(
      recipientId,
      NotificationType.MESSAGE_RECEIVED,
      'New message',
      'You received a new message',
      data.orderId,
    );

    this.server.to(`order-${data.orderId}`).emit('new_message', message);

    return message;
  }
}
