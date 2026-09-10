# SkillShift — Learning Log

> Compact revision sheet for the detailed implementation history in `IMPLEMENTATION_LOG.md`.

## Project Architecture

- SkillShift uses a **single NestJS monolith**, not microservices.
- Next.js → NestJS → PostgreSQL.
- Redis is used for cache/queues/presence.
- S3 is used for file storage.
- BullMQ handles background jobs.
- WebSockets/Socket.IO handle real-time chat.

## Development Method

> Understand → Design → Implement → Test → Break → Fix → Document

The goal is to understand implementation and architectural reasoning, not blindly copy code.

## Database

- User = account/authentication identity.
- Profile = public presentation.
- User ↔ Profile = 1:0..1.
- User ↔ RefreshToken = 1:N for multiple sessions/devices.
- Service belongs to freelancer.
- Order references client, freelancer, and service.
- Order stores price/delivery-day snapshots because services can change.
- Service uses soft deletion so historical orders retain their references.
- Order ↔ Escrow = 1:0..1.
- Order status and Escrow status are separate state machines.
- Order ↔ Dispute = 1:0..1.
- Order ↔ Review = 1:0..1.
- Order ↔ Conversation = 1:0..1.
- Conversation ↔ Message = 1:N.
- Notification uses `isRead` rather than a separate receipt table.
- AuditLog is append-only historical data.

## Money

- Store money as integer paise, not floating-point rupees.
- Wallet, Transaction, Order price, and Escrow amount use the same smallest-unit representation.
- Financial operations use ACID database transactions.

## Order State Machine

```text
PENDING → IN_PROGRESS → DELIVERED → COMPLETED

PENDING / IN_PROGRESS → CANCELLED

DELIVERED → DISPUTED → COMPLETED
                     → REFUNDED
```

Business-layer code enforces legal transitions.

## Escrow State Machine

```text
HOLDING → RELEASED
        → REFUNDED
```

Escrow state is separate from Order state.

## Authentication

- Passwords are hashed.
- Verification/reset tokens are hashed.
- Refresh tokens are stored separately.
- Multiple refresh-token sessions are supported.

## Chat

- One conversation per order.
- Message needs conversationId + senderId + content + timestamp.
- No receiverId because participants can be inferred from the order.

## Prisma

- PrismaService extends PrismaClient.
- PrismaModule provides and exports PrismaService.
- Other modules import PrismaModule to inject PrismaService.
- `OnModuleInit` calls `$connect()`.
- `OnModuleDestroy` calls `$disconnect()`.

## Prisma 7

- Project uses Prisma 7.8.0.
- Uses the `prisma-client` generator with a custom output directory.
- PostgreSQL runtime uses `@prisma/adapter-pg` and `pg`.
- Prisma client is configured with `PrismaPg`.
- `moduleFormat = "cjs"` fixed the runtime module-format mismatch encountered with the current Nest/Node setup.
- `prisma.config.ts` contains the CLI datasource URL.
- `dotenv/config` lets Prisma CLI load `.env`.

## Environment Variables

`.env` contains:

```text
DATABASE_URL=postgresql://postgres:password@localhost:5432/skillshift
REDIS_URL=redis://localhost:6379
```

Important distinction:

- `.env` is a file.
- `process.env` is the runtime environment.
- Prisma CLI loads `.env` through `dotenv/config`.
- NestJS loads `.env` through `ConfigModule.forRoot()`.

## NestJS Configuration

```typescript
ConfigModule.forRoot({
  isGlobal: true,
})
```

This loads environment configuration for the Nest application and makes ConfigModule globally available.

## Debugging Lessons

### `nest: command not found`

Cause: Nest CLI wasn't installed globally in WSL.

Resolution:

```bash
npm install -g @nestjs/cli
```

### `exports is not defined in ES module scope`

Cause: generated Prisma client module format was incompatible with the application runtime.

Resolution:

```prisma
moduleFormat = "cjs"
```

then:

```bash
npx prisma generate
```

### PrismaClient requires valid options

Cause: Prisma 7 PostgreSQL runtime required the driver adapter in this setup.

Resolution:

```bash
npm i @prisma/adapter-pg pg
```

then construct PrismaClient with `PrismaPg`.

## Verification Habit

Use:

```bash
npx tsc --noEmit
```

to type-check without emitting compiled files.

Use:

```bash
npm run start:dev
```

to verify NestJS runtime behavior.

A successful TypeScript compile does **not** prove the runtime will work. Both compile-time and runtime verification matter.
