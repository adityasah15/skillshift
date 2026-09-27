import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiBearerAuth()
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @Get(':orderId/messages')
  async getMessages(
    @Param('orderId') orderId: string,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: { user: JwtPayload },
  ) {
    const parsedLimit = limit ? Number(limit) : 20;

    return this.chatService.getMessages(
      orderId,
      req.user.sub,
      cursor,
      parsedLimit,
    );
  }
}
