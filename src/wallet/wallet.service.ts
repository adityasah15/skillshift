import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prismaService: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prismaService.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }
    return wallet;
  }

  async getBalance(userId: string) {
    return (await this.getWallet(userId)).balance;
  }

  async deposit(userId: string, amount: number) {
    const wallet = await this.getWallet(userId);
    await this.prismaService.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount,
          description: 'Wallet deposit',
        },
      });
    });
    return {
      message: 'Amount deposit was successful',
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.getWallet(userId);
    const transactions = await this.prismaService.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions;
  }
}
