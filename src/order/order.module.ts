import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EscrowModule } from 'src/escrow/escrow.module';

@Module({
  imports: [PrismaModule, EscrowModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
