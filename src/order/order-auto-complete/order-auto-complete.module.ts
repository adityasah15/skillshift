import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrderAutoCompleteProcessor } from './order-auto-complete.processor';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule,
    BullModule.registerQueue({
      name: 'ORDER_AUTO_COMPLETE',
    }),
  ],
  providers: [OrderAutoCompleteProcessor],
  exports: [BullModule],
})
export class OrderAutoCompleteModule {}