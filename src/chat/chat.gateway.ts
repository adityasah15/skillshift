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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
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
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        throw new WsException('Authentication required');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      client.user = payload;

      await this.redisService.incr(`chat:presence:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const key = `chat:presence:${client.user.sub}`;

    const count = await this.redisService.decr(key);

    if (count <= 0) {
      await this.redisService.del(key);
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

  const count = await this.redisService.incrWithTtl(key, 10);

  if (count > 10) {
    throw new WsException(
      'Too many messages. Please slow down.',
    );
  }

 const message = await this.chatService.saveMessage(
  data.orderId,
  client.user.sub,
  data.content,
);

const order = await this.chatService.getOrderParticipants(
  data.orderId,
);

const recipientId =
  order.clientId === client.user.sub
    ? order.freelancerId
    : order.clientId;

await this.notificationService.enqueue(
  recipientId,
  NotificationType.MESSAGE_RECEIVED,
  'New message',
  'You received a new message',
);

this.server
  .to(`order-${data.orderId}`)
  .emit('new_message', message);

return message;
}
}
