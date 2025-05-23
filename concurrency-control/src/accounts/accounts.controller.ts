import { Controller, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('transfer')
  async transfer(
    @Body()
    body: {
      fromAccountNumber: string;
      toAccountNumber: string;
      amount: number;
    },
  ) {
    await this.accountsService.transfer(
      body.fromAccountNumber,
      body.toAccountNumber,
      body.amount,
    );
    return { message: 'Transfer successful' };
  }

  @Post('deposit')
  async deposit(@Body() body: { accountNumber: string; amount: number }) {
    await this.accountsService.deposit(body.accountNumber, body.amount);
    return { message: 'Deposit successful' };
  }
}
