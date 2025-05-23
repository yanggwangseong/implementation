import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async transfer(
    fromAccountNumber: string,
    toAccountNumber: string,
    amount: number,
  ): Promise<void> {
    const fromAccount = await this.accountsRepository.findOne({
      where: { accountNumber: fromAccountNumber },
    });
    const toAccount = await this.accountsRepository.findOne({
      where: { accountNumber: toAccountNumber },
    });

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient balance');
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await this.accountsRepository.save([fromAccount, toAccount]);
  }

  async deposit(accountNumber: string, amount: number): Promise<void> {
    const account = await this.accountsRepository.findOne({
      where: { accountNumber },
    });

    if (!account) {
      throw new Error('Account not found');
    }

    account.balance += amount;
    await this.accountsRepository.save(account);
  }
}
