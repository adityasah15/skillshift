import { Body, Controller, Req, Post, Get, Param, Patch } from '@nestjs/common';
import { OrderService } from './order.service';
import { Role } from 'generated/prisma/enums';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Roles(Role.CLIENT)
  @Post()
  async createOrder(
    @Req() req: { user: JwtPayload },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(req.user.sub, createOrderDto);
  }

  @Get(':id')
  async findOne(
    @Req() req: { user: JwtPayload },
    @Param('id') orderId: string,
  ) {
    return this.orderService.findOne(req.user.sub, orderId);
  }

  @Patch(':id/deliver')
  @Roles(Role.FREELANCER)
  async deliver(
    @Req() req: { user: JwtPayload },
    @Param('id') orderId: string,
    @Body('deliveryNote') deliveryNote: string,
  ) {
    return this.orderService.deliver(req.user.sub, orderId, deliveryNote);
  }

  @Roles(Role.CLIENT, Role.FREELANCER)
  @Post(':id/cancel')
  async cancel(@Req() req: { user: JwtPayload }, @Param('id') orderId: string) {
    return this.orderService.cancel(req.user.sub, orderId);
  }

  @Roles(Role.CLIENT)
  @Post(':id/complete')
  async complete(
    @Req() req: { user: JwtPayload },
    @Param('id') orderId: string,
  ) {
    return this.orderService.complete(req.user.sub, orderId);
  }
}
