## Concurrency Control

```bash
$ docker-compose -f docker-compose.test.yml up -d
$ pnpm run start:dev
```

## 계좌이체

- K가 H에게 20만원을 이체할때 H도 ATM에서 본인 계좌에 30만원을 입금한다면 여러 형태의 실행이 가능할 수 있다

### CASE1

- 1️⃣ Transaction 1
  - K
    - read(K_balance) => 100만원
    - write(K_balance = 80만원) (-20만원)
  - H
    - read(H_balance) => 200만원
    - write(H_balance = 220만원) (+20만원)
- Transaction 1 Commit
- Transaction 2
  - H
    - read(H_balance) => 220만원
    - write(H_balance = 250만원) (+30만원)
- Transaction 2 Commit

### CASE2

- Transaction 2
  - H
    - read(H_balance) => 200만원
    - write(H_balance = 230만원) (+30만원)
- Transaction 2 Commit
- Transaction 1
  - K
    - read(K_balance) => 100만원
    - write(K_balance = 80만원) (-20만원)
  - H
    - read(H_balance) => 230만원
    - write(H_balance = 250만원) (+20만원)
- Transaction 1 Commit

### CASE3

- Transaction 1
  - K
    - read(K_balance) => 100만원
    - write(K_balance = 80만원) (-20만원)
- Transaction 2
  - H
    - read(H_balance) => 200만원
    - write(H_balance = 230만원) (+30만원)
- Transaction 2 Commit
  - read(H_balance) => 230만원
  - write(H_balance = 250만원) (+20만원)
- Transaction 1 Commit

### CASE4 (Lost Update)

- Transaction 1
  - K
    - read(K_balance) => 100만원
    - write(K_balance = 80만원) (-20만원)
  - H
    - read(H_balance) => 200만원
- Transaction 2
  - H
    - read(H_balance) => 200만원
    - write(H_balance = 230만원) (+30만원)
- Transaction 2 Commit
- Transaction 1
  - write(H_balance = 220만원) (+20만원)
- Transaction 1 Commit

### CASE5

- Transaction 1
  - K
    - read(K_balance) => 100만원
    - write(K_balance = 80만원) (-20만원)
- Transaction 2
  - H
    - read(H_balance) => 200만원
    - write(H_balance = 230만원) (+30만원)
- Transaction 1
  - read(H_balance) => 230만원
  - write(H_balance = 250만원) (+20만원)
- Transaction 1 Commit
- Transaction 2 Rollback!
