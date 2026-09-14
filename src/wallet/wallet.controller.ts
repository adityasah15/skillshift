import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { DepositDto } from './dto/deposit.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getBalance(@Req() req: { user: JwtPayload }) {
    return this.walletService.getBalance(req.user.sub);
  }

  @Post('deposit')
  async deposit(
    @Req() req: { user: JwtPayload },
    @Body() depositDto: DepositDto,
  ) {
    return this.walletService.deposit(req.user.sub, depositDto.amount);
  }

  @Get('transactions')
  async getTransactions(@Req() req: { user: JwtPayload }){
    return this.walletService.getTransactions(req.user.sub);
  }
}
