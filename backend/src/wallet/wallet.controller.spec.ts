import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Role } from 'generated/prisma/enums';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { validate } from 'class-validator';
import { WithdrawDto } from './dto/withdraw.dto';

describe('WalletController', () => {
  let controller: WalletController;
  const walletService = { withdraw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: walletService }],
    }).compile();

    controller = module.get<WalletController>(WalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('restricts withdrawals to freelancers and clients and uses the authenticated user', async () => {
    await controller.withdraw(
      { user: { sub: 'freelancer-1', role: Role.FREELANCER } } as never,
      { amount: 100 },
    );

    const withdrawHandler = (
      WalletController.prototype as Record<string, unknown>
    ).withdraw as (...args: unknown[]) => unknown;

    expect(Reflect.getMetadata(ROLES_KEY, withdrawHandler)).toEqual([
      Role.FREELANCER,
      Role.CLIENT,
    ]);
    expect(walletService.withdraw).toHaveBeenCalledWith('freelancer-1', 100);
  });

  it.each([0, -1, 1.5])(
    'rejects invalid withdrawal amount %s',
    async (amount) => {
      const errors = await validate(
        Object.assign(new WithdrawDto(), { amount }),
      );

      expect(errors.map((error) => error.property)).toContain('amount');
    },
  );
});
