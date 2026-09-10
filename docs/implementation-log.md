# SkillShift — Detailed Implementation Log

> **Purpose:** A chronological reconstruction of how SkillShift was designed and implemented, recording **WHAT** we did, **HOW** we did it, **WHY** we did it, problems encountered, fixes, decisions, and verification.
>
> This is intentionally detailed. It is meant to be a reconstruction/learning book, not a polished project README.
>
> **Historical note:** This log reconstructs the earlier SkillShift work from the conversation context available to us. Where the exact original command/output is not available, the entry is marked as a reconstruction rather than presenting invented details as fact.

---

# 0. Project Goal and Development Philosophy

## 0.1 Project: SkillShift

SkillShift is being built as a serious SDE placement/internship resume project.

The project is designed to demonstrate practical backend engineering rather than merely CRUD. The planned system includes:

- NestJS backend
- Next.js frontend
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- AWS S3
- WebSockets / Socket.IO
- Authentication and authorization
- Wallet and simulated escrow
- Orders and order state machines
- Disputes
- Reviews
- Notifications
- Search
- Admin functionality
- Testing
- Docker
- CI/CD
- Deployment

The architecture deliberately uses a **single NestJS monolith**, not microservices.

## 0.2 Development method

The project is being developed with the following loop:

> **Understand → Design → Implement → Test → Break → Fix → Document**

The goal is not to blindly copy code. Before implementing a component, we discuss:

1. What problem it solves.
2. Why it belongs in the architecture.
3. What alternatives exist.
4. Why one design was selected.
5. How it will be implemented.
6. How it will be verified.

---

# 1. Initial Architecture Planning

## 1.1 Reviewing the implementation blueprint

A 27-page Claude-generated SkillShift Implementation Blueprint was used as the starting design reference.

The blueprint proposed:

```text
Next.js frontend
       ↓
NestJS API server
       ↓
PostgreSQL
Redis
AWS S3
```

with BullMQ backed by Redis, background email jobs, and WebSocket functionality inside NestJS.

### Important architectural decision

We chose a **single NestJS monolith** rather than splitting the project into microservices.

### Why?

For a student/resume project, microservices would introduce substantial infrastructure and deployment complexity without adding proportional learning value.

The monolith still demonstrates:

- modular architecture
- dependency injection
- authorization
- database transactions
- queues
- caching
- real-time communication
- testing
- deployment

without requiring multiple independently deployed applications.

---

# 2. Database Domain Design

Before writing database code, we reasoned through the domain entities and their relationships.

The planned database models became:

- User
- Profile
- RefreshToken
- Wallet
- Transaction
- Service
- Order
- Escrow
- Dispute
- Conversation
- Message
- Review
- Notification
- AuditLog

---

## 2.1 User vs Profile

### Decision

Separate authentication/account information (`User`) from public presentation information (`Profile`).

### User responsibilities

`User` contains:

- email
- password hash
- role
- email verification state
- password reset information
- timestamps
- soft-delete information

### Profile responsibilities

`Profile` contains:

- display name
- bio
- avatar
- skills
- portfolio URLs
- rating
- review count

### Why?

Authentication/account identity and public profile information have different responsibilities.

A user can exist before completing a profile, so:

```text
User → Profile
1       0..1
```

The profile's `userId` is unique to enforce one profile per user.

### Freelancer profile decision

We considered whether freelancers needed a completely separate `FreelancerProfile` table.

Decision: **No, not for the current scope.**

Freelancer-specific information such as skills, portfolio, and rating can live in the common Profile model.

### Why?

A separate table would add complexity without enough benefit for this project.

---

# 3. Authentication Database Design

## 3.1 User authentication fields

The User model was designed around:

- `email`
- `passwordHash`
- `role`
- `isEmailVerified`
- `emailVerifyTokenHash`
- `passwordResetTokenHash`
- `passwordResetExpiresAt`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Password storage

Passwords are stored as hashes, never plaintext passwords.

### Verification/reset tokens

Sensitive verification and password-reset tokens are stored as hashes.

### Why?

If the database is compromised, storing raw tokens would allow an attacker to use them directly.

---

## 3.2 RefreshToken as a separate model

### Decision

Use a separate `RefreshToken` table rather than storing one refresh token directly on User.

### Why?

A user can have multiple sessions/devices.

The model therefore supports:

```text
User
 ├── RefreshToken
 ├── RefreshToken
 └── RefreshToken
```

Each token stores:

- userId
- tokenHash
- expiry
- createdAt
- revokedAt

This supports token rotation and revocation.

---

# 4. Order Domain Design

## 4.1 Order fields

An order was designed around:

- client
- freelancer
- service
- status
- price
- delivery days
- requirements
- delivery note
- auto-completion timestamp
- timestamps

The final design includes:

```prisma
clientId
freelancerId
serviceId
status
price
deliveryDays
requirements
deliveryNote
autoCompleteAt
createdAt
updatedAt
```

---

## 4.2 Snapshotting service price and delivery days

### Decision

Store `price` and `deliveryDays` directly on the Order.

### Why?

A service can change after an order is placed.

Example:

```text
Service today:
price = ₹1000
delivery = 5 days

Customer places order

Later freelancer edits service:
price = ₹1500
delivery = 3 days
```

The existing order must still mean:

```text
₹1000
5 days
```

Therefore the order stores a **snapshot** of the commercial terms at booking time.

---

## 4.3 Soft deletion of services

### Decision

Services have:

```prisma
deletedAt DateTime?
```

rather than being physically deleted immediately.

### Why?

Historical orders can still reference the service.

This is separate from the price/delivery snapshot:

- snapshot preserves historical commercial terms
- soft deletion preserves the referenced service record

---

# 5. Order State Machine

The order lifecycle was explicitly designed rather than treating status as arbitrary strings.

Planned states:

```text
PENDING
   ↓
IN_PROGRESS
   ↓
DELIVERED
   ↓
COMPLETED
```

Alternative paths include:

```text
PENDING / IN_PROGRESS
        ↓
    CANCELLED
```

and:

```text
DELIVERED
    ↓
 DISPUTED
   ├──→ COMPLETED
   └──→ REFUNDED
```

Terminal states include:

- COMPLETED
- CANCELLED
- REFUNDED

### Important decision

Valid transitions will be enforced in the **service/business layer**, not merely by trusting the controller/request body.

### Why?

A client should not be able to send:

```json
{ "status": "COMPLETED" }
```

and arbitrarily change an order.

Business rules determine whether a transition is legal.

---

# 6. Escrow Design

## 6.1 Separate Escrow model

Escrow was designed as a separate model with a 1:0..1 relationship with Order.

Fields:

- orderId
- amount
- status
- heldAt
- releasedAt
- refundedAt

States:

```text
HOLDING
   ├──→ RELEASED
   └──→ REFUNDED
```

### Why not put escrow status directly on Order?

Order state and financial state represent different concepts.

For example:

```text
Order = DISPUTED
Escrow = HOLDING
```

is meaningful.

The order is under dispute while the funds remain held.

Therefore they should not be forced into one status field.

---

## 6.2 Escrow does not duplicate Order information

Escrow does not store:

- clientId
- freelancerId
- order status

because those can be obtained through the Order relationship.

### Why?

Avoid unnecessary duplication and conflicting sources of truth.

---

# 7. Wallet and Transaction Design

## 7.1 Simulated wallet

The project uses a simulated wallet rather than a real payment gateway.

Wallet fields:

- userId
- balance
- timestamps

Every user should have a wallet as part of the registration workflow.

---

## 7.2 Integer money representation

### Decision

Money is represented using integers in the smallest currency unit (paise).

Example:

```text
₹100.50 → 10050 paise
```

### Why?

Floating-point numbers can introduce precision problems in financial calculations.

The same integer representation is used consistently for:

- wallet balance
- transaction amounts
- order price
- escrow amount

---

## 7.3 Transaction model

Instead of storing unnecessary sender/receiver/status fields for the current simulated-wallet architecture, transactions were modeled around:

- walletId
- type
- amount
- description
- optional orderId
- createdAt

Transaction types:

```text
DEPOSIT
ESCROW_HOLD
ESCROW_RELEASE
ESCROW_REFUND
WITHDRAWAL
```

### Why?

A Transaction is treated primarily as a **financial history/event record**.

Wallet ownership and order relationships provide the necessary context.

---

# 8. Database Transaction / ACID Reasoning

The wallet and escrow flows must use Prisma database transactions.

For example, booking an order involves multiple related changes:

```text
1. Check wallet balance
2. Deduct wallet balance
3. Create ESCROW_HOLD transaction
4. Create Escrow
5. Create/update Order
```

These operations must succeed together.

### Why?

Without a database transaction, a failure halfway through could produce inconsistent financial state.

Example failure:

```text
Wallet deducted
↓
application crashes
↓
Escrow never created
```

That would be unacceptable.

Therefore these operations will use Prisma's transactional mechanism so the changes are **atomic**.

---

# 9. Dispute Design

Dispute was kept as its own model.

Fields:

- orderId
- clientId
- reason
- status
- adminNote
- createdAt
- resolvedAt

Status:

```text
OPEN
UNDER_REVIEW
RESOLVED_FREELANCER
RESOLVED_CLIENT
```

### Why separate dispute status from Order status?

A dispute has its own lifecycle.

The Order can be:

```text
DISPUTED
```

while the Dispute itself can progress:

```text
OPEN
→ UNDER_REVIEW
→ RESOLVED_CLIENT
```

---

# 10. Review Design

The initial idea included:

- orderId
- serviceId
- clientId
- freelancerId
- rating
- comment
- timestamp

This was refined to:

- orderId
- serviceId
- reviewerId
- revieweeId
- rating
- comment
- createdAt

### Why reviewer/reviewee?

It is more general and directly represents the relationship:

```text
reviewer → reviewee
```

rather than tying the model specifically to the client's identity.

### One review per order

`orderId` is unique.

Therefore:

```text
Order → Review
1       0..1
```

### Business rule

A review is allowed only after successful completion and not after refund.

Rating 1–5 will be enforced at the application/business layer.

---

# 11. Notification Design

Notification fields:

- userId
- type
- title
- body
- isRead
- createdAt

Types include:

```text
ORDER_PLACED
ORDER_DELIVERED
ORDER_COMPLETED
ORDER_CANCELLED
DISPUTE_OPENED
DISPUTE_RESOLVED
MESSAGE_RECEIVED
PAYMENT_RECEIVED
REVIEW_RECEIVED
```

### Decision

Use `isRead` directly on Notification rather than creating a separate read-receipt entity.

### Why?

The current requirements do not justify the extra complexity.

---

# 12. Chat Design

## 12.1 Conversation per order

A Conversation belongs to an Order.

`orderId` is unique.

Therefore:

```text
Order → Conversation
1       0..1
```

### Why?

The chat is specifically tied to an order.

Only the participants in that order should access the conversation.

---

## 12.2 Message design

Message contains:

- conversationId
- senderId
- content
- createdAt

### No receiverId

We intentionally did not add `receiverId`.

### Why?

The receiver can be inferred from the order participants.

The message already knows:

```text
Message
 ↓
Conversation
 ↓
Order
 ↓
client + freelancer
```

Adding receiverId would duplicate information and create another consistency concern.

---

# 13. Audit Log Design

AuditLog is intended to be an append-only historical record.

Fields:

- optional userId
- optional orderId
- action
- before
- after
- createdAt

### System actions

`userId` can be null when an automated/system process performs the action.

### Decision

Audit logs are not meant to be edited.

If a new event occurs, create a new row.

### Why?

Audit logs represent historical facts.

They are not ordinary mutable application data.

Important actions such as order state transitions will be logged.

---

# 14. Final Prisma Schema Design

The resulting schema includes these enums:

```text
Role
ServiceStatus
OrderStatus
EscrowStatus
DisputeStatus
TransactionType
NotificationType
```

and these models:

```text
User
Profile
RefreshToken
Wallet
Transaction
Service
Order
Escrow
Dispute
Conversation
Message
Review
Notification
AuditLog
```

The schema was formatted and validated successfully using Prisma tooling.

---

# 15. Git Setup and Version Control

SkillShift uses Git and GitHub.

Repository:

```text
adityasah15/skillshift
```

The repository is public and uses `main`.

## 15.1 Initial Git issue

An initial push encountered remote divergence.

The local branch and remote branch did not share the exact expected state.

### Resolution

Used:

```bash
git pull --rebase origin main
```

and then pushed again.

The schema design was committed and pushed successfully.

Important commits recorded in the available project history:

```text
501fe81 — rebased schema design commit
6c87201 — initial database migration commit
```

---

# 16. Docker Infrastructure

PostgreSQL and Redis were run using Docker Compose.

Containers:

```text
skillshift-postgres
skillshift-redis
```

Configured ports:

```text
PostgreSQL → 5432
Redis       → 6379
```

The containers were successfully started with:

```bash
docker compose up -d
```

and checked with:

```bash
docker compose ps
```

### Why Docker?

It gives the project reproducible local infrastructure without requiring the database/Redis installation to be managed directly on the host OS.

---

# 17. Prisma Initialization and Migration

Prisma was initialized and the schema was connected to PostgreSQL.

Prisma version in the project:

```text
Prisma 7.8.0
@prisma/client 7.8.0
```

Node:

```text
Node v24.20.0
```

TypeScript:

```text
TypeScript 5.9.3
```

A Prisma migration was created and applied:

```bash
npx prisma migrate dev --name init
```

Generated migration:

```text
prisma/migrations/20260909093127_init/migration.sql
```

and:

```text
prisma/migrations/migration_lock.toml
```

The database was reported as in sync.

The migration was committed and pushed:

```text
6c87201
```

---

# 18. Prisma 7 Configuration Discovery

The project uses Prisma 7's `prisma.config.ts`.

Important configuration:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### Important Prisma 7 distinction

The datasource URL is intentionally not placed back into `schema.prisma`.

The configuration is handled by:

```text
prisma.config.ts
```

This was an important point because Prisma 7 changed the configuration pattern.

---

# 19. Phase 0 — NestJS Prisma Integration

## 19.1 Attempted global Nest CLI command

We initially attempted:

```bash
nest g module prisma
```

The shell returned:

```text
Command 'nest' not found
```

### Why?

The Nest CLI was not globally installed in the WSL environment.

Even if a Windows installation existed, WSL has its own Linux environment and its own npm/global package installation context.

---

## 19.2 Global Nest CLI decision

We considered using:

```bash
npx nest g module prisma
```

but chose to install the Nest CLI globally in the WSL environment:

```bash
npm install -g @nestjs/cli
```

Installation succeeded.

Verification:

```bash
nest --version
```

Result:

```text
12.0.0
```

### Learning

`npm` manages Node packages.

`npx` executes package commands.

A global Nest CLI makes the `nest` executable directly available in the current WSL environment.

---

# 20. Generate PrismaModule

Command:

```bash
nest g module prisma
```

Result:

```text
CREATE src/prisma/prisma.module.ts
UPDATE src/app.module.ts
```

Generated structure:

```text
src/
└── prisma/
    └── prisma.module.ts
```

### Why?

Prisma is infrastructure that will be used by many feature modules.

A dedicated NestJS module provides a clean place to register and export the database service.

The architecture becomes:

```text
AppModule
   ↓
PrismaModule
```

---

# 21. Generate PrismaService

Command:

```bash
nest g service prisma
```

Result:

```text
CREATE src/prisma/prisma.service.spec.ts
CREATE src/prisma/prisma.service.ts
UPDATE src/prisma/prisma.module.ts
```

Structure:

```text
src/prisma/
├── prisma.module.ts
├── prisma.service.ts
└── prisma.service.spec.ts
```

Initial generated service:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {}
```

### Why?

NestJS services are injectable providers.

`PrismaService` will be our NestJS dependency-injection entry point to Prisma Client.

---

# 22. PrismaService Extends PrismaClient

The service was changed conceptually from:

```typescript
class PrismaService {}
```

to:

```typescript
class PrismaService extends PrismaClient {}
```

### Why?

PrismaService becomes a PrismaClient itself through inheritance.

That allows feature services to eventually write:

```typescript
this.prisma.user.findUnique(...)
this.prisma.order.create(...)
this.prisma.wallet.update(...)
```

instead of creating and nesting a separate client object.

Conceptually:

```text
PrismaClient
     ↑
     │ extends
     │
PrismaService
```

---

# 23. Verify Generated Prisma Client

The generated Prisma client was inspected:

```bash
ls generated/prisma/
```

Result included:

```text
browser.ts
client.ts
commonInputTypes.ts
enums.ts
internal/
models/
models.ts
```

`client.ts` contains the generated Prisma client.

The import used by the service was:

```typescript
import { PrismaClient } from 'generated/prisma/client';
```

TypeScript verification:

```bash
npx tsc --noEmit
```

Result:

```text
(no output)
```

### Meaning

The TypeScript compiler found no errors.

---

# 24. Export PrismaService from PrismaModule

The generated module initially registered the provider.

We added:

```typescript
exports: [PrismaService]
```

So the module conceptually became:

```typescript
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Why?

A provider is available inside its own module.

Other modules need the provider exported in order to use it through NestJS dependency injection.

The intended future pattern is:

```text
PrismaModule
    │
    └── exports PrismaService
                    ↑
                    │
              imports module
                    │
               OrderModule
```

---

# 25. Prisma Lifecycle Hooks

We wanted Prisma to connect when NestJS starts and disconnect cleanly when NestJS shuts down.

The service was changed to implement:

```text
OnModuleInit
OnModuleDestroy
```

Startup hook:

```typescript
async onModuleInit() {
  await this.$connect();
}
```

Shutdown hook:

```typescript
async onModuleDestroy() {
  await this.$disconnect();
}
```

### Why?

We don't manually call these methods.

NestJS invokes lifecycle hooks at the appropriate application lifecycle points.

The resulting lifecycle is:

```text
Nest starts
   ↓
onModuleInit()
   ↓
$connect()
   ↓
Database ready
```

and:

```text
Nest shuts down
   ↓
onModuleDestroy()
   ↓
$disconnect()
```

TypeScript verification again passed:

```bash
npx tsc --noEmit
```

---

# 26. First Runtime Prisma Error — Module Format

We started the application:

```bash
npm run start:dev
```

Compilation succeeded:

```text
Found 0 errors. Watching for file changes.
```

But Node crashed while loading the generated Prisma client.

Important error:

```text
ReferenceError: exports is not defined in ES module scope
```

Path included:

```text
dist/generated/prisma/client.js
```

### Diagnosis

There was a module-system mismatch between the generated Prisma client and the way the application was being executed.

The project was using Node's `nodenext` TypeScript module configuration, while the generated output being consumed by Nest/Node was incompatible.

---

# 27. Module Format Fix

The Prisma generator was configured with:

```prisma
moduleFormat = "cjs"
```

So the generator became conceptually:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "cjs"
}
```

Then the Prisma client was regenerated:

```bash
npx prisma generate
```

### Why?

Prisma's generated client supports an explicit module format.

Using CommonJS for this integration resolved the `exports is not defined in ES module scope` runtime problem.

We deliberately did not randomly change multiple TypeScript/Node configuration values.

---

# 28. Second Runtime Prisma Error — Missing Client Options / Adapter

After fixing the module format, the application progressed further but produced a new error:

```text
PrismaClientInitializationError:
`PrismaClient` needs to be constructed with a non-empty,
valid `PrismaClientOptions`
```

The important lesson:

> The previous module-format problem was fixed. We had reached a new, separate Prisma initialization problem.

### Diagnosis

This project uses Prisma 7 and the `prisma-client` generator. In this setup, the PostgreSQL Prisma client needs the appropriate database driver adapter.

---

# 29. Install PostgreSQL Prisma Adapter

Installed:

```bash
npm i @prisma/adapter-pg pg
```

Result:

```text
added 19 packages
```

The packages provide:

```text
@prisma/adapter-pg
    ↓
Prisma PostgreSQL adapter

pg
    ↓
Node PostgreSQL driver
```

### Warnings

npm reported:

```text
18 vulnerabilities (6 moderate, 12 high)
```

and warnings about install scripts not yet being approved.

### Decision

Do not run:

```bash
npm audit fix --force
```

blindly during setup.

Dependency/security cleanup can be handled deliberately later because forced fixes can introduce breaking changes.

---

# 30. Environment Variable Investigation

The `.env` file contained:

```text
DATABASE_URL="postgresql://postgres:password@localhost:5432/skillshift"

REDIS_URL="redis://localhost:6379"
```

We ran:

```bash
echo $DATABASE_URL
```

and got no output.

### Why?

A `.env` file and a shell environment variable are not the same thing.

The file can contain:

```text
DATABASE_URL=...
```

without Bash automatically exporting that variable into the current shell.

---

# 31. Why Prisma CLI Could Still See DATABASE_URL

The Prisma config begins with:

```typescript
import "dotenv/config";
```

That loads `.env` for the Prisma configuration process.

Therefore commands such as:

```bash
npx prisma migrate dev
npx prisma generate
```

could read the `.env` value.

The NestJS application was a different process and had not yet been configured to load `.env`.

---

# 32. Add NestJS ConfigModule

`@nestjs/config` was already installed in the project.

`AppModule` was configured with:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
})
```

Conceptually:

```text
.env
 ↓
ConfigModule
 ↓
process.env
 ↓
PrismaService and other application services
```

### Why `isGlobal: true`?

It makes the configuration module globally available, avoiding repeated imports throughout the application.

---

# 33. PrismaPg Adapter Construction

The Prisma service was then configured around the PostgreSQL adapter.

The constructor became conceptually:

```typescript
constructor() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  super({ adapter });
}
```

### Why `super({ adapter })`?

`PrismaService` extends `PrismaClient`.

The parent PrismaClient constructor must receive the adapter.

The local `adapter` variable can be created before `super()` because it does not use `this`.

The derived-class instance itself cannot be used before `super()`.

Final conceptual structure:

```text
DATABASE_URL
     ↓
PrismaPg
     ↓
PrismaClient
     ↓
PrismaService
```

---

# 34. TypeScript Verification

After configuring the adapter:

```bash
npx tsc --noEmit
```

produced no output.

### Meaning

The project type-checked successfully.

---

# 35. Successful NestJS + Prisma Startup

We finally ran:

```bash
npm run start:dev
```

Compilation:

```text
Found 0 errors. Watching for file changes.
```

Nest startup logs included:

```text
[NestFactory] Starting Nest application...
```

then:

```text
[InstanceLoader] PrismaModule dependencies initialized
```

and finally:

```text
[NestApplication] Nest application successfully started
```

### Result

The previous Prisma initialization errors were gone.

The application successfully started with:

```text
NestJS
 ↓
PrismaModule
 ↓
PrismaService
 ↓
PrismaPg
 ↓
PostgreSQL
```

The default AppController route was also successfully mapped:

```text
AppController {/}
Mapped {/, GET} route
```

---

# 36. Current State

At this point, the project has successfully reached:

```text
Docker PostgreSQL ─────────────┐
                               │
Docker Redis ──────────────────┤
                               │
                               ▼
                         NestJS App
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ConfigModule       PrismaModule
                    │                   │
                  .env            PrismaService
                                        │
                                    PrismaPg
                                        │
                                  Prisma Client
                                        │
                                   PostgreSQL
```

The actual Prisma infrastructure is in:

```text
src/prisma/
├── prisma.module.ts
├── prisma.service.ts
└── prisma.service.spec.ts
```

The next planned verification is to execute an **actual Prisma database query**, rather than only verifying that the application initializes successfully.

---

# 37. Important Decisions Recorded So Far

## Architecture

- Single NestJS monolith.
- Modular feature architecture.
- PostgreSQL as source of truth.
- Redis for caching/queues/presence.
- S3 for file storage.
- BullMQ for background jobs.
- WebSocket/Socket.IO inside NestJS.

## Database

- Prisma ORM.
- PostgreSQL.
- Soft deletion for services/users where appropriate.
- Order price/delivery snapshots.
- Separate Escrow state from Order state.
- Integer paise for monetary values.
- ACID database transactions for wallet/escrow operations.
- Append-only audit logging.

## Authentication

- Password hashes.
- Hashed verification/reset tokens.
- Separate refresh-token records.
- Multiple sessions supported.

## Chat

- One conversation per order.
- Messages belong to conversations.
- No redundant receiverId.

## Prisma/NestJS integration

- Dedicated PrismaModule.
- PrismaService extends PrismaClient.
- PrismaService exported from PrismaModule.
- Lifecycle hooks for connect/disconnect.
- Prisma 7 PostgreSQL adapter.
- `ConfigModule` loads `.env`.
- CommonJS Prisma client output selected for current Nest/Node integration.

---

# 38. Commands Learned So Far

### Nest

```bash
npm install -g @nestjs/cli
nest --version
nest g module prisma
nest g service prisma
```

### Prisma

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

### TypeScript

```bash
npx tsc --noEmit
```

### Docker

```bash
docker compose up -d
docker compose ps
```

### Git

```bash
git pull --rebase origin main
git push
```

---

# 39. Working Rule for Future Entries

From this point onward, every meaningful implementation/debugging step should be appended using:

## WHAT

What changed?

## HOW

Exact commands, files, code/config changes, and sequence of actions.

## WHY

Why did we do it this way?

## PROBLEM

If something failed, record the exact failure.

## DIAGNOSIS

What did the error actually mean?

## FIX

What changed to resolve it?

## VERIFICATION

How did we prove the change worked?

## DECISION

If alternatives existed, record what we chose and why.

## LEARNING

What concept should be remembered for interviews/rebuilding the project?

This log intentionally preserves failed attempts because debugging history is part of the engineering learning process.
