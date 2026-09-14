# SkillShift Architecture

## Current Architecture

SkillShift is implemented as a **NestJS monolith**.

The backend is structured into domain modules while running within a single NestJS application.

```text
                    ┌──────────────────────┐
                    │   Next.js Frontend   │
                    │      (later)         │
                    └──────────┬───────────┘
                               │
                         HTTP / WebSocket
                               │
                    ┌──────────▼───────────┐
                    │     NestJS API       │
                    │       Monolith       │
                    │                       │
                    │ Auth │ User │ Wallet │
                    │ Service │ Order │ ...│
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────▼─┐   ┌▼──────────┐
                 │ PostgreSQL │   │   Redis   │
                 │ persistent │   │ cache /   │
                 │   state    │   │ queues    │
                 └────────────┘   └───────────┘
```

PostgreSQL is the persistent source of truth.

Redis is used according to the Blueprint for caching, rate limiting, presence, and BullMQ-backed background processing.

AWS S3 will be used later for file storage.

## Current Modules

Implemented backend modules currently include:

* Auth
* User/Profile
* Wallet

Additional modules are planned according to the Blueprint.

## Wallet Architecture

The Wallet module owns wallet-related operations:

```text
Authenticated Request
        │
        ▼
   WalletController
        │
        ▼
    WalletService
        │
        ├── Wallet lookup
        │
        ├── Balance operation
        │
        ├── Deposit
        │      │
        │      └── Prisma transaction
        │             ├── Increment balance
        │             └── Create DEPOSIT transaction
        │
        └── Transaction history
                 │
                 └── newest-first
```

### Financial Data Rules

Wallet balance and transaction data are stored in PostgreSQL and are not Redis-cached.

The Blueprint requires wallet balance to remain fresh because it represents financial state.

### Atomic Deposit

A wallet deposit changes both the wallet balance and transaction history.

Therefore:

```text
POST /wallet/deposit
        │
        ▼
   Prisma $transaction
        │
        ├── Increment wallet balance
        │
        └── Create DEPOSIT transaction
```

Both operations succeed or fail together.

## Future Financial Architecture

The Wallet module will later interact with the Order and Escrow modules.

The planned flow is:

```text
Client Wallet
     │
     │ ESCROW_HOLD
     ▼
   Escrow
     │
     ├── ESCROW_RELEASE ──► Freelancer Wallet
     │
     └── ESCROW_REFUND ───► Client Wallet
```

These multi-step financial operations will also use Prisma transactions.

## Design Principle

Financial state remains in PostgreSQL.

Redis is not used as the source of truth for wallet balances or financial transactions.
