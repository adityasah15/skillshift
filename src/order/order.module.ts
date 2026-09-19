import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EscrowModule } from 'src/escrow/escrow.module';
import { OrderAutoCompleteModule } from './order-auto-complete/order-auto-complete.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [PrismaModule, EscrowModule, OrderAutoCompleteModule, NotificationModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
