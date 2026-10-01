import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@Req() req: { user: JwtPayload }) {
    return this.notificationService.listForUser(req.user.sub);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: { user: JwtPayload }) {
    return this.notificationService.unreadCount(req.user.sub);
  }

  @Patch(':id/read')
  async markRead(
    @Req() req: { user: JwtPayload },
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.markRead(req.user.sub, notificationId);
  }

  @Post('read-all')
  async markAllRead(@Req() req: { user: JwtPayload }) {
    return this.notificationService.markAllRead(req.user.sub);
  }
}
