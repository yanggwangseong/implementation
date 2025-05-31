import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private dataSource: DataSource,
  ) {}

  // Case 1: K가 H에게 20만원 이체, H가 ATM에서 30만원 입금
  async case1Example(): Promise<void> {
    // Transaction 1: K -> H 20만원 이체
    await this.dataSource.transaction(async (manager) => {
      // K의 잔고 읽기
      const k = await manager.findOne(Account, { where: { owner: 'K' } });
      // H의 잔고 읽기
      const h = await manager.findOne(Account, { where: { owner: 'H' } });

      if (!k || !h) throw new Error('Account not found');
      if (k.balance < 200000) throw new Error('Insufficient funds');

      // K -20만원
      k.balance -= 200000;
      // H +20만원
      h.balance += 200000;

      await manager.save([k, h]);
      // Transaction 1 commit
    });

    // Transaction 2: H가 ATM에서 30만원 입금
    await this.dataSource.transaction(async (manager) => {
      // H의 잔고 읽기
      const h = await manager.findOne(Account, { where: { owner: 'H' } });
      if (!h) throw new Error('Account not found');

      // H +30만원
      h.balance += 300000;
      await manager.save(h);
      // Transaction 2 commit
    });
  }

  // Case 2: H가 ATM에서 30만원 입금 후, K가 H에게 20만원 이체
  async case2Example(): Promise<void> {
    // Transaction 2: H가 ATM에서 30만원 입금
    await this.dataSource.transaction(async (manager) => {
      // H의 잔고 읽기
      const h = await manager.findOne(Account, { where: { owner: 'H' } });
      if (!h) throw new Error('Account not found');

      // H +30만원
      h.balance += 300000;
      await manager.save(h);
      // Transaction 2 commit
    });

    // Transaction 1: K -> H 20만원 이체
    await this.dataSource.transaction(async (manager) => {
      // K의 잔고 읽기
      const k = await manager.findOne(Account, { where: { owner: 'K' } });
      // H의 잔고 읽기
      const h = await manager.findOne(Account, { where: { owner: 'H' } });

      if (!k || !h) throw new Error('Account not found');
      if (k.balance < 200000) throw new Error('Insufficient funds');

      // K -20만원
      k.balance -= 200000;
      // H +20만원
      h.balance += 200000;

      await manager.save([k, h]);
      // Transaction 1 commit
    });
  }

  // Case 3: 트랜잭션이 겹쳐서 H의 입금이 먼저 커밋되고, 그 후 K의 이체가 H의 잔고에 반영됨
  async case3Example(): Promise<void> {
    // Transaction 1: K -> H 20만원 이체 (커밋은 나중에)
    await this.dataSource.transaction(async (manager1) => {
      // K의 잔고 읽기
      const k = await manager1.findOne(Account, { where: { owner: 'K' } });
      if (!k) throw new Error('Account not found');
      if (k.balance < 200000) throw new Error('Insufficient funds');
      // K -20만원
      k.balance -= 200000;
      // Transaction 2: H가 ATM에서 30만원 입금
      await this.dataSource.transaction(async (manager2) => {
        // H의 잔고 읽기
        const h = await manager2.findOne(Account, { where: { owner: 'H' } });
        if (!h) throw new Error('Account not found');
        // H +30만원
        h.balance += 300000;
        await manager2.save(h);
        // Transaction 2 커밋

        // Transaction 1에서, H의 잔고를 읽을때 H의 잔고는 230만원인 상태
        const hAfter = await manager1.findOne(Account, {
          where: { owner: 'H' },
        });
        if (!hAfter) throw new Error('Account not found');
        hAfter.balance += 200000;
        // Transaction 1 H잔고 커밋 (Transaction 2 커밋 후)
        await manager1.save(hAfter);
      });
      // Transaction 1 K잔고 커밋
      await manager1.save(k);
    });
  }

  // Lost Update 문제 예시
  // Case 4: 트랜잭션이 겹쳐서 H의 입금이 먼저 커밋되고, 그 후 K의 이체가 H의 잔고에 반영되지만, 마지막에 H의 잔고가 덮어써짐
  async case4Example(): Promise<void> {
    // Transaction 1: K -> H 20만원 이체 (H의 잔고는 아직 반영X)
    await this.dataSource.transaction(async (manager1) => {
      // K의 잔고 읽기
      const k = await manager1.findOne(Account, { where: { owner: 'K' } });
      // H의 잔고 읽기
      const h = await manager1.findOne(Account, { where: { owner: 'H' } });
      if (!k || !h) throw new Error('Account not found');
      if (k.balance < 200000) throw new Error('Insufficient funds');
      // K -20만원
      k.balance -= 200000;
      await manager1.save(k);
      // H의 잔고를 읽어두지만, 아직 write하지 않음
      // Transaction 1은 아직 커밋하지 않음 (논리적 시뮬레이션)
    });

    // Transaction 2: H가 ATM에서 30만원 입금
    await this.dataSource.transaction(async (manager2) => {
      // H의 잔고 읽기
      const h = await manager2.findOne(Account, { where: { owner: 'H' } });
      if (!h) throw new Error('Account not found');
      // H +30만원
      h.balance += 300000;
      await manager2.save(h);
      // Transaction 2 커밋
    });

    // Transaction 1의 H 잔고 write (덮어쓰기)
    await this.dataSource.transaction(async (manager1) => {
      const h = await manager1.findOne(Account, { where: { owner: 'H' } });
      if (!h) throw new Error('Account not found');
      // Transaction 1에서 읽었던 값에 +20만원만 반영 (실제로는 200만원에서 +20만원)
      h.balance = 2200000;
      await manager1.save(h);
      // Transaction 1 커밋
    });
  }

  // Case 5: Transaction 2 rolls back
  async case5Example(): Promise<void> {
    // Transaction 1: K -> H 20만원 이체
    await this.dataSource.transaction(async (manager1) => {
      // K의 잔고 읽기
      const k = await manager1.findOne(Account, { where: { owner: 'K' } });
      if (!k) throw new Error('Account not found');
      if (k.balance < 200000) throw new Error('Insufficient funds');
      // K -20만원
      k.balance -= 200000;
      await manager1.save(k);

      // Transaction 2: H가 ATM에서 30만원 입금 (나중에 롤백됨)
      await this.dataSource.transaction(async (manager2) => {
        // H의 잔고 읽기
        const h = await manager2.findOne(Account, { where: { owner: 'H' } });
        if (!h) throw new Error('Account not found');
        // H +30만원
        h.balance += 300000;
        await manager2.save(h);
        // Transaction 2는 나중에 롤백됨
      });

      // Transaction 1에서 H의 잔고를 읽을 때는 Transaction 2의 변경사항이 반영된 상태
      const h = await manager1.findOne(Account, { where: { owner: 'H' } });
      if (!h) throw new Error('Account not found');
      // H +20만원 (Transaction 2의 변경사항이 반영된 상태에서 +20만원)
      h.balance += 200000;
      await manager1.save(h);
      // Transaction 1 커밋
    });

    // Transaction 2 롤백 (실제로는 이미 롤백된 상태)
    // 이 시점에서는 Transaction 1이 이미 커밋되었고, H의 잔고는 Transaction 2의 변경사항이 롤백되지 않은 상태로 남아있음
  }
}
