import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { TransactionType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from './wallet.service';

type TransactionCallback = (
  transaction: Prisma.TransactionClient,
) => Promise<unknown>;

describe('WalletService', () => {
  let service: WalletService;

  const prisma = {
    wallet: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('returns the user wallet', async () => {
    const wallet = { id: 'wallet-1', userId: 'user-1', balance: 500 };
    prisma.wallet.findUnique.mockResolvedValue(wallet);

    await expect(service.getWallet('user-1')).resolves.toBe(wallet);
    expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('throws when the user wallet does not exist', async () => {
    prisma.wallet.findUnique.mockResolvedValue(null);

    await expect(service.getWallet('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the wallet balance', async () => {
    prisma.wallet.findUnique.mockResolvedValue({ balance: 500 });

    await expect(service.getBalance('user-1')).resolves.toBe(500);
  });

  it('updates integer minor units and records the deposit in one transaction', async () => {
    const wallet = { id: 'wallet-1', userId: 'user-1', balance: 500 };
    const updatedWallet = { ...wallet, balance: 600 };
    const walletUpdate = jest.fn().mockResolvedValue(updatedWallet);
    const transactionCreate = jest.fn().mockResolvedValue({});
    prisma.wallet.findUnique.mockResolvedValue(wallet);
    prisma.$transaction.mockImplementation((callback: TransactionCallback) =>
      callback({
        wallet: { update: walletUpdate },
        transaction: { create: transactionCreate },
      } as unknown as Prisma.TransactionClient),
    );

    await expect(service.deposit('user-1', 100)).resolves.toBe(updatedWallet);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(walletUpdate).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: { increment: 100 } },
    });
    expect(transactionCreate).toHaveBeenCalledWith({
      data: {
        walletId: 'wallet-1',
        type: TransactionType.DEPOSIT,
        amount: 100,
        description: 'Wallet deposit',
      },
    });
  });

  describe('withdraw', () => {
    it('conditionally debits and records a simulated withdrawal atomically', async () => {
      const wallet = { id: 'wallet-1', userId: 'user-1', balance: 500 };
      const updatedWallet = { ...wallet, balance: 400 };
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const findUnique = jest.fn().mockResolvedValue(updatedWallet);
      const transactionCreate = jest.fn().mockResolvedValue({});
      prisma.wallet.findUnique.mockResolvedValue(wallet);
      prisma.$transaction.mockImplementation((callback: TransactionCallback) =>
        callback({
          wallet: { updateMany, findUnique },
          transaction: { create: transactionCreate },
        } as unknown as Prisma.TransactionClient),
      );

      await expect(service.withdraw('user-1', 100)).resolves.toBe(updatedWallet);

      expect(updateMany).toHaveBeenCalledWith({
        where: { id: 'wallet-1', balance: { gte: 100 } },
        data: { balance: { decrement: 100 } },
      });
      expect(transactionCreate).toHaveBeenCalledWith({
        data: {
          walletId: 'wallet-1',
          type: TransactionType.WITHDRAWAL,
          amount: 100,
          description: 'Simulated wallet withdrawal',
        },
      });
      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'wallet-1' } });
    });

    it('rejects an amount greater than the current balance before a transaction', async () => {
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 50,
      });

      await expect(service.withdraw('user-1', 100)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a conditional debit failure without creating a ledger entry', async () => {
      const transactionCreate = jest.fn();
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
      });
      prisma.$transaction.mockImplementation((callback: TransactionCallback) =>
        callback({
          wallet: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            findUnique: jest.fn(),
          },
          transaction: { create: transactionCreate },
        } as unknown as Prisma.TransactionClient),
      );

      await expect(service.withdraw('user-1', 100)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(transactionCreate).not.toHaveBeenCalled();
    });
  });

  it('returns transactions in reverse chronological order', async () => {
    const wallet = { id: 'wallet-1', userId: 'user-1', balance: 500 };
    const transactions = [{ id: 'transaction-1' }];
    prisma.wallet.findUnique.mockResolvedValue(wallet);
    prisma.transaction.findMany.mockResolvedValue(transactions);

    await expect(service.getTransactions('user-1')).resolves.toBe(transactions);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: { walletId: 'wallet-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
