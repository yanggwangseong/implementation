import { Controller, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('case1')
  async case1() {
    await this.accountsService.case1Example();
    return { message: 'Case 1 executed' };
  }

  @Post('case2')
  async case2() {
    await this.accountsService.case2Example();
    return { message: 'Case 2 executed' };
  }

  @Post('case3')
  async case3() {
    await this.accountsService.case3Example();
    return { message: 'Case 3 executed' };
  }

  @Post('case4')
  async case4() {
    await this.accountsService.case4Example();
    return { message: 'Case 4 executed' };
  }

  @Post('case5')
  async case5() {
    await this.accountsService.case5Example();
    return { message: 'Case 5 executed' };
  }
}
