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

---

# Implementation Log — Prisma ↔ PostgreSQL Connectivity Verification

## Date
2026-09-10

## Milestone
Verified that the SkillShift NestJS application can successfully communicate with the PostgreSQL database through Prisma.

---

## 1. Objective

After integrating Prisma with PostgreSQL and getting the NestJS application to start successfully, the next goal was to verify that Prisma could perform an actual database operation.

Application startup alone was not enough to prove database connectivity.

The intended flow to verify was:

NestJS Controller → PrismaService → PrismaClient → PrismaPg Adapter → PostgreSQL

A minimal temporary database query was chosen so that database connectivity could be tested independently of any actual SkillShift feature.

---

## 2. Why `SELECT NOW()` Was Chosen

The temporary query selected was:

```sql
SELECT NOW()
````

This was intentionally chosen because:

* It does not require any existing application data.
* It does not modify the database.
* It directly verifies that PostgreSQL can execute a query.
* PostgreSQL returns a timestamp, making the result easy to recognize.
* It avoids prematurely building a real feature just to test connectivity.

This was treated as a temporary smoke test.

---

## 3. Understanding PrismaService

The existing `PrismaService` extends `PrismaClient`.

Conceptually:

```text
PrismaService
    ↓ extends
PrismaClient
    ↓ uses
PrismaPg adapter
    ↓ uses
pg driver
    ↓ connects through
DATABASE_URL
    ↓
PostgreSQL
```

The Prisma PostgreSQL adapter is responsible for providing the PostgreSQL driver connection mechanism, while `PrismaClient` provides the database query API.

Because `PrismaService` extends `PrismaClient`, it inherits Prisma's query methods.

Examples include:

```typescript
this.user.findMany()
this.user.findUnique()
this.user.create()
this.user.update()
```

For raw SQL, Prisma provides methods such as:

```typescript
this.$queryRaw
this.$executeRaw
```

`$queryRaw` is appropriate when the SQL query is expected to return rows.

`$executeRaw` is intended for raw SQL operations where the main purpose is execution rather than retrieving result rows.

---

## 4. Initial Implementation Mistake

The first attempt placed the query directly inside the class body:

```typescript
const result = await this.$queryRaw`SELECT NOW()`;
```

This produced the TypeScript error:

```text
A CLASS MEMBER CANNOT HAVE THE 'CONST' KEYWORD.
```

### Why this happened

`const` declares a local variable and must be used inside an executable scope such as a function or method.

A class body can contain methods, properties, constructors, etc., but a standalone `const` declaration cannot be placed directly in the class body.

The correct structure was therefore:

```text
class
├── constructor()
├── onModuleInit()
├── onModuleDestroy()
└── testDatabase()
        └── const result
```

---

## 5. Temporary `testDatabase()` Method

The query was moved into a temporary method:

```typescript
async testDatabase() {
  const result = await this.$queryRaw`SELECT NOW()`;
  return result;
}
```

### What this method does

1. Calls Prisma's `$queryRaw`.
2. Sends `SELECT NOW()` to PostgreSQL.
3. Waits for the asynchronous database operation using `await`.
4. Stores the returned result in `result`.
5. Returns the result to the caller.

The use of `await` is necessary because database operations are asynchronous.

The `$queryRaw` call uses a tagged template literal:

```typescript
this.$queryRaw`SELECT NOW()`
```

---

## 6. Temporary Controller Endpoint

To invoke the method through the running NestJS application, a temporary endpoint was added to `AppController`.

Conceptually:

```text
GET /test-db
      ↓
AppController
      ↓
PrismaService.testDatabase()
      ↓
PostgreSQL
```

The controller called:

```typescript
return this.prismaService.testDatabase();
```

This allowed the database query to be tested through the actual application request path rather than executing Prisma independently.

---

## 7. First Runtime Failure

The endpoint initially produced:

```text
PrismaClientKnownRequestError

Invalid `prisma.$queryRaw()` invocation:

Raw query failed.
Message: Can't reach database server at 127.0.0.1:5432
```

The important part was:

```text
Can't reach database server at 127.0.0.1:5432
```

This indicated that the application had reached the Prisma query layer, but PostgreSQL could not be reached at the configured address and port.

The problem was therefore not the SQL query itself.

---

## 8. Diagnosing Docker/WSL Connectivity

The next step was to check whether the PostgreSQL Docker container was running.

The command:

```bash
docker ps
```

initially returned:

```text
Command 'docker' not found
```

This occurred because the Docker CLI was temporarily unavailable inside the WSL environment.

Docker was not immediately installed inside WSL because the development environment was using Docker Desktop and installing another Docker setup inside WSL could have unnecessarily complicated the environment.

Docker Desktop was restarted.

After restarting Docker Desktop, the command:

```bash
docker ps
```

successfully showed:

```text
skillshift-redis
skillshift-postgres
```

The PostgreSQL container was running with:

```text
0.0.0.0:5432->5432/tcp
```

and Redis was running with:

```text
0.0.0.0:6379->6379/tcp
```

This confirmed that the PostgreSQL container was available and port 5432 was exposed.

---

## 9. Successful Database Query

With Docker working again, the temporary endpoint was tested using:

```bash
curl http://localhost:3000/test-db
```

The response was:

```json
[
  {
    "now": "2026-09-10T09:38:58.959Z"
  }
]
```

This successfully demonstrated that PostgreSQL executed:

```sql
SELECT NOW()
```

and returned the result through Prisma and NestJS.

The `Z` suffix indicates that the timestamp is represented in UTC.

---

## 10. What Was Proven

The successful request verified the complete runtime path:

```text
curl
  ↓
GET /test-db
  ↓
NestJS Controller
  ↓
PrismaService
  ↓
PrismaClient
  ↓
PrismaPg
  ↓
pg driver
  ↓
PostgreSQL container
  ↓
SELECT NOW()
  ↓
PostgreSQL result
  ↓
Prisma
  ↓
NestJS HTTP response
  ↓
curl
```

This is a stronger verification than merely seeing:

```text
Nest application successfully started
```

Application startup proved that NestJS and Prisma could initialize.

The `SELECT NOW()` test proved that the application could actually execute a database query against PostgreSQL.

---

## 11. Removing the Temporary Smoke Test

The `/test-db` endpoint was not part of SkillShift's actual requirements.

It was created only to verify database connectivity.

After the successful test, the following temporary code was removed:

* `testDatabase()` from `PrismaService`
* `/test-db` route from `AppController`
* The temporary controller call to `PrismaService.testDatabase()`

`AppController` was restored to its original responsibility:

```typescript
@Get()
getHello(): string {
  return this.appService.getHello();
}
```

`PrismaService` was restored to its intended permanent implementation containing only:

* PostgreSQL adapter initialization
* Prisma client initialization
* `$connect()` during module initialization
* `$disconnect()` during module destruction

---

## 12. Final Verification

After removing the temporary smoke test:

```bash
npx tsc --noEmit
```

completed successfully.

The NestJS development server also started successfully.

Therefore:

* TypeScript compilation passed.
* NestJS startup passed.
* Prisma initialization passed.
* PostgreSQL connectivity had already been verified through the real query.
* Temporary test code was removed.
* The application was left in a clean state.

---

## 13. Development Lesson

This was an example of a database connectivity smoke test.

The purpose was not to build functionality, but to isolate and verify one technical dependency before continuing with feature development.

The approach was:

```text
Integrate
   ↓
Start application
   ↓
Build minimal smoke test
   ↓
Encounter connectivity failure
   ↓
Diagnose infrastructure
   ↓
Fix Docker/WSL availability
   ↓
Verify real DB query
   ↓
Remove temporary test
   ↓
Continue development
```

This avoids discovering database connectivity problems later while simultaneously debugging a larger feature such as authentication or orders.

---

## 14. Current State After This Milestone

SkillShift now has:

* PostgreSQL running through Docker
* Redis running through Docker
* Prisma schema and initial migration
* Prisma PostgreSQL adapter
* `PrismaService`
* `PrismaModule`
* Global configuration loading through `ConfigModule`
* Successful real PostgreSQL query verification
* Clean NestJS startup after removing the temporary test

The database integration is therefore considered **verified**.

The next development step can focus on building actual SkillShift functionality rather than infrastructure verification.
---

# Authentication Module & User Registration

## Date
2026-09-10

## Milestone
Created the initial Auth module and implemented the first real SkillShift feature: user registration.

---

## 1. Auth Module Setup

The first feature after completing database integration was Authentication.

The project follows the modular NestJS architecture defined in the blueprint:

```text
src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.controller.spec.ts
├── auth.service.spec.ts
└── dto/
    └── register.dto.ts
````

The module, controller, and service were generated using the Nest CLI:

```bash
nest g module auth
nest g controller auth
nest g service auth
```

Nest automatically registered `AuthModule` inside `AppModule`.

---

## 2. Auth Module Responsibilities

The intended request flow is:

```text
HTTP Request
    ↓
AuthController
    ↓
AuthService
    ↓
PrismaService
    ↓
PostgreSQL
```

The controller handles HTTP-level concerns.

The service contains authentication business logic.

Prisma is accessed through `PrismaService` rather than directly creating Prisma clients inside the Auth feature.

---

## 3. Prisma Dependency Injection

`AuthModule` imports `PrismaModule`.

`PrismaModule` exports `PrismaService`.

This allows `AuthService` to inject `PrismaService`:

```typescript
constructor(private readonly prismaService: PrismaService) {}
```

The resulting dependency relationship is:

```text
PrismaModule
    ↓ exports
PrismaService
    ↓ injected into
AuthService
```

This follows NestJS dependency-injection and module-boundary principles.

---

## 4. Registration DTO

Created:

```text
src/auth/dto/register.dto.ts
```

The DTO accepts:

```text
email
password
```

Validation decorators were added using `class-validator`.

The intended validation rules are:

* Email must be a valid email address.
* Password must be a string.
* Password must contain at least 8 characters.

The DTO uses the TypeScript definite-assignment operator:

```typescript
email!: string;
password!: string;
```

instead of disabling `strictPropertyInitialization` globally.

This was chosen because DTO properties are populated by NestJS from the incoming request rather than initialized through a constructor.

---

## 5. Global ValidationPipe

Initially, the DTO validation decorators existed but invalid requests were still accepted.

For example:

```json
{
  "email": "bad-email",
  "password": "123"
}
```

was incorrectly accepted.

The reason was that validation decorators define validation rules but NestJS must be configured to execute those rules.

Added to `src/main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

This enables DTO validation globally across the application.

After this change, the invalid request correctly returned:

```json
{
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

This means future DTOs can also use `class-validator` rules without configuring validation separately for every controller.

---

## 6. Registration Endpoint

Added:

```text
POST /auth/register
```

The controller receives the request body as a `RegisterDto` and passes it to `AuthService`.

The controller therefore remains thin and delegates business logic to the service.

---

## 7. Registration Business Logic

The implemented registration flow is:

```text
POST /auth/register
        ↓
Validate DTO
        ↓
Find existing user
        ↓
If email exists → 409 Conflict
        ↓
Hash password with bcrypt
        ↓
Database transaction
    ├── Create User
    ├── Create Profile
    └── Create Wallet
        ↓
Return safe response
```

---

## 8. Existing Email Check

Before creating a user, the service checks whether the email already exists:

```typescript
const existingUser = await this.prismaService.user.findUnique({
  where: {
    email: registerDto.email,
  },
});
```

If a matching user exists:

```typescript
throw new ConflictException('Email already registered');
```

This returns HTTP `409 Conflict`.

The database also has a unique constraint on `User.email`, providing database-level protection against duplicate emails.

---

## 9. Password Hashing

The raw password is never stored directly.

The registration flow uses bcrypt:

```typescript
const passwordHash = await bcrypt.hash(registerDto.password, 12);
```

The salt/cost factor was set to `12`, following the SkillShift blueprint.

The database receives:

```text
passwordHash
```

rather than:

```text
password
```

This ensures the plaintext password is not persisted.

---

## 10. Atomic User/Profile/Wallet Creation

A newly registered user requires three related records:

```text
User
 ├── Profile
 └── Wallet
```

These records are created inside a single Prisma transaction:

```typescript
this.prismaService.$transaction(async (tx) => {
  ...
});
```

Inside the transaction, the transaction-scoped Prisma client `tx` is used:

```text
tx.user.create()
tx.profile.create()
tx.wallet.create()
```

This is important because all three database operations should succeed or fail together.

Without a transaction, this could happen:

```text
User created
    ↓
Profile creation fails
    ↓
User remains without Profile
```

With the transaction:

```text
User
Profile
Wallet
   ↓
all succeed → COMMIT

any operation fails → ROLLBACK
```

The created user's ID is used when creating the Profile and Wallet.

---

## 11. Profile Creation

A Profile is created for every newly registered user.

The initial display name is derived from the email prefix.

For example:

```text
test@example.com
        ↓
displayName = test
```

The Profile references the newly created User through:

```text
userId
```

---

## 12. Wallet Creation

A Wallet is created during registration.

Only the `userId` needs to be supplied because the Prisma schema defines:

```text
balance Int @default(0)
```

Therefore every newly created wallet starts with:

```text
balance = 0
```

---

## 13. Safe Registration Response

The complete Prisma User record is not returned.

Instead, only safe fields are returned:

```json
{
  "id": "...",
  "email": "...",
  "role": "CLIENT"
}
```

Sensitive fields such as:

```text
passwordHash
emailVerifyTokenHash
passwordResetTokenHash
```

are not exposed.

---

## 14. Registration Testing

The endpoint was tested using `curl`.

Example:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Successful response:

```json
{
  "id": "d9dd2e0e-cbee-423c-89c8-2d0be2a5615a",
  "email": "test@example.com",
  "role": "CLIENT"
}
```

---

## 15. Duplicate Email Test

The same registration request was submitted again.

The API correctly returned:

```json
{
  "message": "Email already registered",
  "error": "Conflict",
  "statusCode": 409
}
```

This verified the duplicate-email business rule.

---

## 16. Validation Test

The following invalid request was initially accepted before `ValidationPipe` was enabled:

```json
{
  "email": "bad-email",
  "password": "123"
}
```

After adding the global `ValidationPipe`, the same request correctly returned:

```text
400 Bad Request
```

with validation messages for both the email and password.

This confirmed that DTO validation is now being executed.

---

## 17. Direct Database Verification

After successful registration, the database was inspected directly using PostgreSQL's CLI.

The PostgreSQL CLI was opened inside the Docker container with:

```bash
docker exec -it skillshift-postgres psql -U postgres -d skillshift
```

The command means:

```text
docker exec
    ↓
run a command inside the skillshift-postgres container
    ↓
psql
    ↓
PostgreSQL command-line client
    ↓
-U postgres
    ↓
connect as postgres user
    ↓
-d skillshift
    ↓
connect to skillshift database
```

The following queries were used:

```sql
SELECT id, email, "role" FROM "User";
```

```sql
SELECT "userId", "displayName" FROM "Profile";
```

```sql
SELECT "userId", balance FROM "Wallet";
```

The results confirmed that registration created:

```text
User
Profile
Wallet
```

for the test account.

---

## 18. Foreign Key Behavior During Test Cleanup

Two test users were created during testing:

```text
test@example.com
bad-email
```

An attempt was made to delete the users directly:

```sql
DELETE FROM "User"
WHERE email IN ('test@example.com', 'bad-email');
```

PostgreSQL rejected the deletion because Profile rows still referenced the Users:

```text
ERROR: update or delete on table "User" violates foreign key constraint
```

This demonstrated that foreign-key constraints protect referenced records.

The dependent rows were therefore deleted first:

```text
Wallet
   ↓
Profile
   ↓
User
```

After cleanup:

```sql
SELECT email FROM "User";
```

returned:

```text
(0 rows)
```

The development database was therefore returned to a clean state.

---

## 19. New CLI Tools Learned

Several command-line tools/commands were encountered during registration testing.

### `curl`

Used as a command-line HTTP client to interact with the NestJS API.

Important options used:

```text
-X POST → HTTP method
-H      → HTTP header
-d      → request body/data
```

### `docker exec`

Runs a command inside an existing Docker container.

### `psql`

PostgreSQL's command-line client.

### `\q`

Exits the interactive `psql` session.

### SQL commands

Queries such as:

```sql
SELECT ...
DELETE ...
```

were executed directly against PostgreSQL.

These tools provide a way to test the backend independently of a frontend.

---

## 20. Verification Summary

Registration was verified at multiple levels:

### TypeScript

```bash
npx tsc --noEmit
```

passed successfully.

### API

Valid registration succeeded.

Duplicate registration returned `409 Conflict`.

Invalid registration returned `400 Bad Request`.

### Database

Direct PostgreSQL inspection confirmed User, Profile, and Wallet creation.

### Transaction

The three related records were created through a single Prisma transaction.

### Cleanup

All test users and dependent records were removed.

---

## 21. Current State

The first real SkillShift feature is now implemented:

```text
POST /auth/register
```

The system can now:

* Validate registration input.
* Detect duplicate emails.
* Hash passwords using bcrypt.
* Create User, Profile, and Wallet atomically.
* Return a safe response.
* Reject invalid DTO input.
* Communicate successfully with PostgreSQL.

The next Auth functionality can build on this foundation.

Yep. Append the following to the **end** of each file.

### `docs/implementation-log.md`

````markdown
## Email Verification Implementation

### Overview

Implemented the first complete email-verification flow for SkillShift.

The registration flow now generates a cryptographically secure verification token, stores only its bcrypt hash in PostgreSQL, and sends the raw token to the user's email through Nodemailer and Ethereal SMTP.

A dedicated `/auth/verify-email` endpoint validates the token and marks the user's email as verified. Verification tokens are single-use because the stored token hash is cleared after successful verification.

### Dependencies Added

Added:

- `nodemailer`
- `@types/nodemailer`

The existing `class-validator`, `class-transformer`, and `bcrypt` dependencies from registration continue to be used.

### Verification Token Generation

During registration:

1. Check whether the email already exists.
2. Hash the user's password with bcrypt using cost factor 12.
3. Generate a cryptographically secure random verification token using Node's `crypto.randomBytes()`.
4. Convert the random bytes to a hexadecimal string.
5. Hash the verification token with bcrypt.
6. Store only the hashed verification token in `User.emailVerifyTokenHash`.
7. Leave `User.isEmailVerified` as `false`.

The raw verification token is kept only in application memory and is not stored in the database.

Relevant implementation:

```typescript
const verificationToken = randomBytes(32).toString('hex');
const verificationTokenHash = await bcrypt.hash(verificationToken, 12);
````

The hashed token is stored when creating the user:

```typescript
emailVerifyTokenHash: verificationTokenHash,
```

### Email Sending Architecture

Created a dedicated `MailModule` and `MailService`.

Structure:

```text
AuthModule
    ↓
MailModule
    ↓
MailService
    ↓
Nodemailer
    ↓
SMTP server
    ↓
User's email inbox
```

`MailService` owns the Nodemailer transporter and SMTP configuration.

SMTP configuration is loaded through NestJS `ConfigService` rather than hard-coded credentials.

Environment variables used:

```text
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
MAIL_FROM
```

`.env` remains ignored by Git so SMTP credentials are not committed to the repository.

### Nodemailer Transporter

Configured a Nodemailer transporter using the SMTP settings:

```typescript
this.transporter = nodemailer.createTransport({
  host: this.configService.get<string>('SMTP_HOST'),
  port: Number(this.configService.get<string>('SMTP_PORT')),
  secure: false,
  auth: {
    user: this.configService.get<string>('SMTP_USER'),
    pass: this.configService.get<string>('SMTP_PASS'),
  },
});
```

SMTP port `587` is used with `secure: false`.

### Verification Email

Added:

```typescript
sendVerificationEmail(email: string, token: string)
```

to `MailService`.

The service constructs a verification URL containing the user's email and raw verification token:

```text
http://localhost:3000/auth/verify-email?email=<email>&token=<token>
```

The email is sent using Nodemailer's `sendMail()`.

The raw token is appropriate to include in the verification email because it is transmitted to the user for verification, while only its hash is stored in the database.

### Registration → Email Flow

After the database transaction successfully creates the User, Profile, and Wallet, registration sends the verification email:

```typescript
await this.mailService.sendVerificationEmail(
  result.email,
  verificationToken,
);
```

The raw verification token is not included in the registration API response.

Registration continues to return only:

```typescript
{
  id,
  email,
  role,
}
```

This prevents sensitive fields such as `passwordHash` and the raw verification token from being exposed through the API response.

### Email Verification Endpoint

Added:

```text
GET /auth/verify-email
```

The endpoint receives:

```text
email
token
```

as query parameters and passes them to `AuthService.verifyEmail()`.

Example:

```text
GET /auth/verify-email?email=user@example.com&token=<token>
```

### Verification Logic

`verifyEmail()` performs the following checks:

1. Find the user by email.
2. If the user does not exist, throw `NotFoundException`.
3. If the email is already verified, throw `BadRequestException`.
4. If no verification token hash is available, throw `BadRequestException`.
5. Compare the raw token with the stored bcrypt hash using `bcrypt.compare()`.
6. Reject the request if the token does not match.
7. If valid, update the user:

   * `isEmailVerified = true`
   * `emailVerifyTokenHash = null`
8. Return a success message.

The token comparison uses:

```typescript
const match = await bcrypt.compare(
  token,
  user.emailVerifyTokenHash,
);
```

The database update uses:

```typescript
await this.prismaService.user.update({
  where: { email },
  data: {
    isEmailVerified: true,
    emailVerifyTokenHash: null,
  },
});
```

### Single-Use Verification Token

Verification tokens are intentionally single-use.

After successful verification:

```text
isEmailVerified = true
emailVerifyTokenHash = null
```

Therefore, attempting to use the same verification link again results in:

```text
Email is already verified
```

This prevents an old verification token from remaining valid indefinitely after successful use.

### Why the Token Is Not Hashed Again for Lookup

The raw token cannot simply be hashed again and searched against the stored bcrypt hash.

Bcrypt uses a random salt, so hashing the same raw token again produces a different bcrypt hash.

The correct process is:

```text
Raw token
    ↓
Find candidate user
    ↓
bcrypt.compare(raw token, stored hash)
    ↓
Valid / Invalid
```

The user's email is currently included in the verification URL so the backend can identify the candidate user before performing `bcrypt.compare()`.

### Module Integration

`MailModule` provides and exports `MailService`:

```typescript
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

`AuthModule` imports `MailModule`, allowing `AuthService` to inject `MailService` through NestJS dependency injection.

`AuthService` constructor now receives:

```typescript
constructor(
  private readonly prismaService: PrismaService,
  private readonly mailService: MailService,
) {}
```

### Testing Performed

#### TypeScript compilation

Verified that the implementation compiles successfully:

```text
npx tsc --noEmit
```

Result: passed.

#### Registration test

Registered a new test account and confirmed that the API response contains only:

```text
id
email
role
```

The raw verification token is no longer returned by the API.

#### Email delivery test

Registered a test user and confirmed that the verification email appeared in the Ethereal mailbox.

The email contained the expected:

* Subject
* Verification message
* Verification link
* Email query parameter
* Verification token query parameter

#### Verification test

Opened the verification link and confirmed:

```json
{
  "message": "Email verified successfully"
}
```

#### Token reuse test

Opened the same verification link a second time.

The second attempt was rejected because the user was already verified and the token hash had been cleared.

#### Database verification

Queried PostgreSQL for the test user and confirmed:

```text
isEmailVerified = true
emailVerifyTokenHash = NULL
```

This confirms that the verification state was persisted correctly in PostgreSQL.

### Current Authentication Flow

The implemented registration and verification flow is now:

```text
POST /auth/register
        ↓
Validate email/password
        ↓
Check duplicate email
        ↓
Hash password
        ↓
Generate random verification token
        ↓
Hash verification token
        ↓
Prisma transaction
   ├── Create User
   ├── Create Profile
   └── Create Wallet
        ↓
Send verification email
        ↓
User opens verification link
        ↓
GET /auth/verify-email
        ↓
Find user by email
        ↓
bcrypt.compare(token, stored hash)
        ↓
Valid?
   ├── No → reject
   └── Yes
        ↓
isEmailVerified = true
emailVerifyTokenHash = NULL
        ↓
Verification successful
```

### Production Consideration

The current implementation sends the verification email synchronously after the database transaction.

This is acceptable for the current development implementation and keeps the flow easy to understand.

The project blueprint specifies BullMQ background email jobs with retries/backoff. A future improvement is therefore to move email sending into a background queue:

```text
Registration
    ↓
DB transaction
    ↓
Queue email job
    ↓
Registration response
    ↓
BullMQ worker
    ↓
MailService
    ↓
SMTP
```

This would prevent temporary SMTP failures from directly blocking registration and would allow failed email jobs to be retried.

### Milestone Status

Email verification is implemented and tested end-to-end.

Completed:

* Verification token generation
* Secure token hashing
* Verification token persistence
* Nodemailer setup
* SMTP configuration through `ConfigService`
* Verification email delivery
* Verification endpoint
* Token validation
* Single-use token behavior
* Database state update
* End-to-end Ethereal testing
* TypeScript compilation verification



# **Login, JWT Authentication & Refresh Tokens**

## **Date**

2026-09-11

## **Milestone**

Extended the SkillShift Auth module from registration/email verification into a complete access-token and refresh-token authentication flow.

Implemented:

* Login
* Password verification
* Email-verification enforcement
* JWT access tokens
* JWT Passport strategy
* Typed JWT payload
* Protected `/auth/me`
* Global JWT authentication guard
* `@Public()` decorator
* Refresh tokens
* Refresh-token hashing
* Refresh-token expiry
* Refresh-token rotation
* Refresh-token revocation
* Atomic refresh-token rotation

---

## **1. Login DTO**

Created:

```text
src/auth/dto/login.dto.ts
```

The DTO accepts:

```text
email
password
```

Validation rules:

* Email must be valid.
* Password must be a string.
* Password must contain at least 8 characters.

Implementation:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
```

The same global `ValidationPipe` used during registration validates the login request.

---

## **2. Login Endpoint**

Added:

```text
POST /auth/login
```

The controller receives a `LoginDto` and delegates authentication to `AuthService`.

The controller remains thin:

```text
HTTP Request
     ↓
AuthController
     ↓
AuthService
```

The authentication and credential verification logic belongs to the service layer.

---

## **3. Login Business Logic**

The login flow is:

```text
POST /auth/login
        ↓
Validate DTO
        ↓
Find user by email
        ↓
Compare password with passwordHash
        ↓
Check email verification
        ↓
Generate JWT
        ↓
Return access token
```

If the email does not exist or the password is incorrect, the API returns:

```text
Invalid email or password
```

The implementation intentionally does not reveal whether the email exists separately from whether the password is incorrect.

---

## **4. Password Verification**

The stored password is a bcrypt hash created during registration.

During login, the supplied password is compared against the stored hash:

```typescript
const match = await bcrypt.compare(
  loginDto.password,
  existingUser.passwordHash,
);
```

The raw password is therefore never compared directly with a database value and is never stored.

---

## **5. Email Verification Check**

Users must verify their email before they can log in successfully.

After successful password verification:

```typescript
if (!existingUser.isEmailVerified) {
  throw new BadRequestException('Please verify your email first');
}
```

The authentication flow is therefore:

```text
Correct email/password
        ↓
Is email verified?
   ├── No → reject
   └── Yes
        ↓
Generate JWT
```

This prevents an unverified account from obtaining an authenticated access token.

---

## **6. JWT Access Token**

Added JWT support using `@nestjs/jwt`.

A successful login generates:

```typescript
const accessToken = this.jwtService.sign({
  sub: existingUser.id,
  email: existingUser.email,
  role: existingUser.role,
});
```

The payload contains:

```text
sub   → User ID
email → User email
role  → User role
```

The resulting login response contains:

```json
{
  "accessToken": "..."
}
```

Sensitive information such as:

```text
passwordHash
emailVerifyTokenHash
passwordResetTokenHash
```

is never included in the response.

---

## **7. JWT Expiration Configuration**

The JWT configuration is loaded through `ConfigService`.

Environment configuration:

```text
JWT_SECRET=<secret>
JWT_EXPIRES_IN=15m
```

The JWT module is configured asynchronously:

```typescript
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
    },
  }),
})
```

The access token is therefore intentionally short-lived.

---

## **8. JWT Payload Typing**

Initially, the JWT strategy used an untyped payload.

This was changed to use a dedicated `JwtPayload` type.

Created:

```text
src/auth/types/jwt-payload.ts
```

The payload contains:

```typescript
import { Role } from 'generated/prisma/enums';

export class JwtPayload {
  sub!: string;

  email!: string;

  role!: Role;
}
```

The strategy now accepts:

```typescript
validate(payload: JwtPayload) {
  return payload;
}
```

This removes the need for `any` when handling the JWT payload.

---

## **9. JWT Strategy**

Created:

```text
src/auth/strategies/jwt.strategy/jwt.strategy.ts
```

The strategy extends NestJS Passport's JWT strategy.

The token is extracted from:

```text
Authorization: Bearer <token>
```

using:

```typescript
ExtractJwt.fromAuthHeaderAsBearerToken()
```

The JWT secret is loaded through:

```typescript
configService.getOrThrow<string>('JWT_SECRET')
```

Using `getOrThrow()` ensures that a missing JWT secret is treated as a configuration error instead of allowing an undefined value.

---

## **10. Passport Authentication**

Installed the required Passport packages:

```text
@nestjs/passport
passport
passport-jwt
@types/passport-jwt
```

The `JwtStrategy` was registered as a provider inside `AuthModule`.

The resulting authentication architecture is:

```text
HTTP Request
     ↓
JwtAuthGuard
     ↓
Passport
     ↓
JwtStrategy
     ↓
Verify JWT
     ↓
validate(payload)
     ↓
req.user
```

---

## **11. Protected `/auth/me` Endpoint**

Added:

```text
GET /auth/me
```

The endpoint is protected with `JwtAuthGuard`.

A successful authenticated request returns the validated JWT payload through `req.user`.

Conceptually:

```text
Authorization: Bearer <JWT>
        ↓
JwtAuthGuard
        ↓
JwtStrategy
        ↓
JWT validated
        ↓
req.user
        ↓
/auth/me response
```

---

## **12. JWT Guard**

Created:

```text
src/auth/guards/jwt-auth/
```

The guard extends:

```typescript
AuthGuard('jwt')
```

The basic guard allows Passport to perform JWT authentication.

The guard was later extended to support public routes.

---

## **13. `@Public()` Decorator**

Because the authentication guard is applied globally, some routes must explicitly bypass authentication.

Created a `@Public()` decorator using route metadata.

The guard checks:

```typescript
const isPublic = this.reflector.getAllAndOverride<boolean>(
  IS_PUBLIC_KEY,
  [context.getHandler(), context.getClass()],
);
```

If the route is public:

```typescript
return true;
```

Otherwise:

```typescript
return super.canActivate(context);
```

The intended architecture is:

```text
Every route
    ↓
JWT Guard
    ↓
@Public()?
 ├── YES → allow
 └── NO  → require JWT
```

---

## **14. Global JWT Authentication Guard**

The JWT guard was registered globally so that protected-by-default behavior applies throughout the application.

This means new endpoints will automatically require authentication unless they explicitly use:

```typescript
@Public()
```

Public authentication endpoints include:

```text
POST /auth/register
POST /auth/login
GET  /auth/verify-email
POST /auth/refresh
```

Protected endpoints require a valid access token.

---

## **15. Guard Test Issue**

After adding `Reflector` to the JWT guard constructor:

```typescript
constructor(private reflector: Reflector) {
  super();
}
```

the generated unit test produced:

```text
TS2554: Expected 1 arguments, but got 0.
```

The generated test was attempting:

```typescript
new JwtAuthGuard()
```

but the guard now required a `Reflector`.

The test was corrected to provide the required dependency.

This was another example of dependency injection affecting unit-test construction.

---

## **16. JWT Verification Testing**

Login was tested using a verified test account.

A successful login returned an access token.

The decoded JWT contained:

```json
{
  "sub": "...",
  "email": "emailtest@example.com",
  "role": "CLIENT",
  "iat": "...",
  "exp": "..."
}
```

The expiration interval was verified:

```text
exp - iat = 900 seconds
```

Therefore:

```text
900 seconds = 15 minutes
```

which confirms that the configured access-token lifetime is working.

---

## **17. Protected Endpoint Testing**

Tested:

```text
GET /auth/me
```

### Without access token

Result:

```text
401 Unauthorized
```

### With valid access token

The endpoint returned the authenticated JWT payload.

### With modified/tampered token

A modified JWT was rejected with:

```text
401 Unauthorized
```

This confirmed that the JWT signature is being verified rather than simply trusting the token payload.

---

## **18. Refresh Token Design**

After implementing short-lived access tokens, refresh tokens were added for persistent authentication sessions.

The database already contained a dedicated:

```text
RefreshToken
```

model.

The model contains:

```text
id
userId
tokenHash
expiresAt
createdAt
revokedAt
```

This allows one user to have multiple refresh-token records representing different sessions/devices.

---

## **19. Refresh Token Generation**

During login, a cryptographically random refresh token is generated:

```typescript
const refreshToken = randomBytes(32).toString('hex');
```

The raw token is returned to the client.

It is not stored directly in PostgreSQL.

---

## **20. Refresh Token Hashing**

Before persistence, the refresh token is hashed using bcrypt:

```typescript
const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
```

The database stores:

```text
tokenHash
```

rather than:

```text
refreshToken
```

The security model is therefore:

```text
Raw refresh token
        ↓
      Client

Raw refresh token
        ↓
     bcrypt
        ↓
    tokenHash
        ↓
    PostgreSQL
```

This prevents the database from containing directly usable refresh credentials.

---

## **21. Refresh Token Expiration**

Refresh tokens are given a seven-day lifetime.

The database record stores:

```typescript
expiresAt: new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
)
```

Therefore:

```text
Access token  → 15 minutes
Refresh token → 7 days
```

The short-lived access token limits exposure while the refresh token allows the session to continue without requiring the user to log in again.

---

## **22. Refresh Endpoint**

Added:

```text
POST /auth/refresh
```

A `RefreshTokenDto` was created:

```text
src/auth/dto/refresh-token.dto.ts
```

It validates the supplied refresh token as a string.

The endpoint is marked:

```typescript
@Public()
```

because an expired access token cannot be used to authenticate the refresh request.

---

## **23. Refresh Token Validation**

The refresh service first retrieves active refresh-token records:

```typescript
const tokens = await this.prismaService.refreshToken.findMany({
  where: {
    revokedAt: null,
  },
});
```

The supplied raw token is compared against the stored bcrypt hashes:

```typescript
for (const token of tokens) {
  const match = await bcrypt.compare(
    refreshToken,
    token.tokenHash,
  );

  if (match) {
    matchedToken = token;
    break;
  }
}
```

If no active record matches:

```text
401 Invalid refresh token
```

---

## **24. Refresh Token Expiry Check**

After finding the matching database record, the service checks:

```typescript
if (matchedToken.expiresAt <= new Date()) {
  throw new UnauthorizedException('Refresh token expired');
}
```

Therefore a token can fail authentication even if its hash is correct when its expiry time has passed.

---

## **25. User Lookup During Refresh**

The matched refresh-token record contains the user's ID.

The user is retrieved using:

```typescript
const user = await this.prismaService.user.findUnique({
  where: { id: matchedToken.userId },
});
```

If the associated user does not exist, the request is rejected with:

```text
Invalid refresh token
```

This keeps authentication failure responses consistent.

---

## **26. Generating New Access and Refresh Tokens**

After successful refresh-token validation, a new access token is generated using the same JWT payload:

```typescript
const accessToken = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  role: user.role,
});
```

A new refresh token is also generated:

```typescript
const newRefreshToken = randomBytes(32).toString('hex');

const newRefreshTokenHash = await bcrypt.hash(
  newRefreshToken,
  12,
);
```

The response contains:

```json
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

## **27. Refresh Token Rotation**

Refresh tokens are rotated after successful use.

The flow is:

```text
Refresh Token A
       ↓
Validate
       ↓
Revoke Token A
       ↓
Generate Token B
       ↓
Store hash of Token B
       ↓
Return Token B
```

The old refresh token is therefore no longer reusable after rotation.

---

## **28. Refresh Token Revocation**

The old token is revoked by setting:

```typescript
revokedAt: new Date()
```

The record is not deleted.

Conceptually:

```text
Old token

createdAt  → session creation
revokedAt  → session termination
```

Keeping the record preserves session history and provides an explicit revocation state.

---

## **29. Atomic Refresh Token Rotation**

Initially, revoking the old token and creating the replacement were separate database operations.

This was improved using a Prisma transaction:

```typescript
await this.prismaService.$transaction(async (tx) => {
  await tx.refreshToken.update({
    where: { id: matchedToken.id },
    data: { revokedAt: new Date() },
  });

  await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
    },
  });
});
```

The important property is:

```text
Revoke old token
       +
Create new token
       ↓
ONE DATABASE TRANSACTION
```

If an operation fails, the transaction can roll back rather than leaving the session in a partially-updated state.

---

## **30. Refresh Token Rotation Testing**

The complete refresh flow was tested.

### Initial login

```text
Login
 ↓
Refresh Token A
```

### First refresh

```text
Refresh Token A
 ↓
/auth/refresh
 ↓
Access Token B
Refresh Token B
```

### Reusing old token

The original refresh token was used again.

Result:

```text
401 Unauthorized
```

because the original token had been revoked.

### Using new token

The newly issued refresh token was used.

Result:

```text
Successful refresh
```

This confirmed that refresh-token rotation and revocation are functioning correctly.

---

## **31. Refresh Token Database Verification**

Prisma Studio was started successfully but could not be opened through the browser on its dynamically assigned WSL port.

The server itself was verified using:

```bash
curl http://localhost:51212
```

and:

```bash
curl http://127.0.0.1:51212
```

Both returned Prisma Studio HTML.

Therefore Prisma Studio itself was running correctly.

For direct database verification, PostgreSQL was opened inside the Docker container:

```bash
docker exec -it skillshift-postgres psql -U postgres -d skillshift
```

The refresh-token records were inspected using:

```sql
SELECT "userId", "tokenHash", "expiresAt", "revokedAt"
FROM "RefreshToken";
```

The new refresh-token row was present.

The important verification was:

```text
tokenHash → bcrypt hash
expiresAt → approximately 7 days in the future
revokedAt → NULL
```

A blank `revokedAt` represents SQL `NULL`, meaning the newly created refresh session was active.

---

## **32. Current Refresh Authentication Flow**

The complete current authentication flow is:

```text
POST /auth/login
        ↓
Validate credentials
        ↓
Check email verification
        ↓
Generate 15-minute access JWT
        ↓
Generate refresh token
        ↓
Hash refresh token
        ↓
Store RefreshToken record
        ↓
Return access + refresh tokens
```

When the access token expires:

```text
POST /auth/refresh
        ↓
Receive refresh token
        ↓
Find active token record
        ↓
bcrypt.compare()
        ↓
Check expiry
        ↓
Find user
        ↓
Generate new access JWT
        ↓
Generate new refresh token
        ↓
Hash new refresh token
        ↓
Prisma transaction
 ├── Revoke old token
 └── Create new token
        ↓
Return new access + refresh tokens
```

---

## **33. Current Authentication Architecture**

The authentication architecture is now:

```text
                     ┌──────────────────────┐
                     │      AuthModule      │
                     └──────────┬───────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ↓                  ↓                  ↓
      AuthController       AuthService        JwtStrategy
             │                  │                  │
             │                  ↓                  │
             │            PrismaService            │
             │                  │                  │
             │                  ↓                  │
             │             PostgreSQL              │
             │                                     │
             └────────── JwtAuthGuard ──────────────┘
                              │
                              ↓
                         Protected Routes
```

Public routes explicitly use:

```text
@Public()
```

while all other routes are protected by the global JWT guard.

---

## **34. Current Authentication Status**

Completed:

```text
User registration             ✅
Password hashing              ✅
Profile creation              ✅
Wallet creation               ✅
Email verification            ✅
Verification token hashing    ✅
Login                         ✅
Password verification         ✅
Email verification check      ✅
JWT access token              ✅
15-minute JWT expiry          ✅
Typed JWT payload             ✅
Passport JWT strategy         ✅
Protected /auth/me            ✅
Global JWT guard              ✅
@Public() decorator           ✅
Refresh token generation      ✅
Refresh token hashing         ✅
7-day refresh expiry          ✅
Refresh endpoint              ✅
Refresh token rotation        ✅
Refresh token revocation      ✅
Atomic rotation               ✅
JWT tampering rejection       ✅
Refresh-token reuse rejection ✅
```

Not yet implemented:

```text
Logout
Password reset
Rate limiting
Background email queue
HTTP-only refresh-token cookie
Role-based authorization
Ownership authorization
```

These will be implemented in later authentication/security stages.

---

## **35. Performance Consideration — Refresh Token Lookup**

The current refresh-token implementation retrieves active refresh-token records and performs bcrypt comparison until a match is found.

Conceptually:

```text
find active tokens
        ↓
bcrypt.compare() against hashes
        ↓
find matching token
```

This is correct for the current implementation but does not scale efficiently if a user base contains a very large number of active sessions.

The optimization is intentionally deferred until the authentication hardening stage.

A future design can introduce a lookup-friendly token identifier while continuing to hash the secret portion.

The important distinction is:

```text
Current priority:
correctness + security + understanding

Later priority:
performance optimization
```

---

## **36. Verification Summary**

### TypeScript

Repeatedly verified using:

```bash
npx tsc --noEmit
```

The authentication implementation passed TypeScript compilation after the JWT strategy, guard, refresh-token DTO, and refresh-token service changes.

### API

Verified:

```text
POST /auth/login
GET  /auth/me
POST /auth/refresh
```

including successful and failure cases.

### JWT

Verified:

```text
15-minute expiry
valid signature
tampered-token rejection
correct payload
```

### Database

Verified:

```text
RefreshToken row created
tokenHash stored instead of raw token
expiresAt set
revokedAt initially NULL
old token revoked after rotation
```

### Refresh rotation

Verified:

```text
old token → rejected after rotation
new token → successful
```

---

## **37. Milestone Status**

The core access-token and refresh-token authentication system is now implemented and tested.

The next authentication increment is **logout/session revocation**.

## **Refresh Token Lookup Optimization**

The initial refresh-token implementation searched through all active refresh-token records and used `bcrypt.compare()` until a matching hash was found.

This worked correctly but was inefficient because every refresh could require multiple bcrypt comparisons.

The implementation was changed to use a lookup-friendly token format:

```text
tokenId.secret
```

The `tokenId` corresponds directly to the `RefreshToken.id` stored in PostgreSQL, while only the secret portion is hashed.

### Token generation

```typescript
const tokenId = randomUUID();
const secret = randomBytes(32).toString('hex');

const refreshToken = `${tokenId}.${secret}`;

const refreshTokenHash = await bcrypt.hash(secret, 12);
```

The database stores:

```text
id         → tokenId
tokenHash  → bcrypt(secret)
```

This means the raw secret is never stored.

### Refresh lookup

The token is split into its two components:

```typescript
const [tokenId, secret] = refreshToken.split('.');
```

Malformed tokens are rejected:

```typescript
if (!tokenId || !secret) {
  throw new UnauthorizedException('Invalid refresh token');
}
```

The refresh-token record can then be located directly:

```typescript
const matchedToken =
  await this.prismaService.refreshToken.findUnique({
    where: { id: tokenId },
  });
```

The server then verifies the secret:

```typescript
const match = await bcrypt.compare(
  secret,
  matchedToken.tokenHash,
);
```

Therefore the new flow is:

```text
refreshToken
     ↓
tokenId.secret
     ↓
extract tokenId
     ↓
findUnique(id)
     ↓
check revoked / expiry
     ↓
bcrypt.compare(secret, tokenHash)
     ↓
refresh accepted
```

This removes the previous scan through all active refresh-token hashes.

### Refresh-token rotation update

The newly generated refresh token also follows the same format:

```typescript
const newTokenId = randomUUID();
const newSecret = randomBytes(32).toString('hex');

const newRefreshToken = `${newTokenId}.${newSecret}`;

const newRefreshTokenHash =
  await bcrypt.hash(newSecret, 12);
```

The new database record explicitly uses:

```typescript
id: newTokenId
```

This ensures the token returned to the client can always be directly mapped to its database record.

---

## **Current-Session Logout**

Implemented:

```text
POST /auth/logout
```

Logout revokes only the refresh-token session currently being used.

The access JWT is not blacklisted.

### Logout flow

```text
POST /auth/logout
        ↓
JWT authentication
        ↓
req.user.sub
        ↓
refreshToken
        ↓
extract tokenId + secret
        ↓
find refresh-token record
        ↓
verify token ownership
        ↓
bcrypt.compare()
        ↓
set revokedAt
```

The service method receives:

```typescript
async logout(
  userId: string,
  refreshToken: string,
)
```

The refresh token is first parsed:

```typescript
const [tokenId, secret] =
  refreshToken.split('.');
```

The token must contain both components.

The database record is then found using the token ID:

```typescript
const matchedToken =
  await this.prismaService.refreshToken.findUnique({
    where: { id: tokenId },
  });
```

Revoked or nonexistent tokens are rejected.

The service also verifies that the refresh-token session belongs to the authenticated user:

```typescript
if (matchedToken.userId !== userId) {
  throw new UnauthorizedException(
    'Invalid refresh token',
  );
}
```

The secret is then verified against the stored bcrypt hash.

After successful verification:

```typescript
await this.prismaService.refreshToken.update({
  where: { id: matchedToken.id },
  data: { revokedAt: new Date() },
});
```

The endpoint returns:

```json
{
  "message": "Logged out successfully"
}
```

---

## **Access Token Behaviour During Logout**

The access JWT remains valid until its normal expiration.

This is intentional.

SkillShift uses:

```text
Access JWT     → 15 minutes
Refresh token  → 7 days
```

Logout immediately revokes the refresh-token session, preventing the user from obtaining another access token.

The existing access token can remain valid for its remaining short lifetime.

The design therefore avoids maintaining a server-side blacklist for every access JWT while keeping the maximum post-logout access-token lifetime limited.

The resulting model is:

```text
Logout
│
├── Refresh token → revoked immediately
│
└── Access token  → valid until expiration
```

---

## **Logout Testing**

The logout endpoint was tested using a valid access token and its corresponding refresh token.

Successful logout returned:

```text
200 OK
```

with:

```json
{
  "message": "Logged out successfully"
}
```

The same refresh token was then submitted to:

```text
POST /auth/refresh
```

and was rejected with:

```text
401 Unauthorized
```

This verified that logout actually revoked the refresh session rather than only returning a success response.

The existing access token was also used with:

```text
GET /auth/me
```

and remained valid.

This confirmed the intended distinction between refresh-token revocation and short-lived access-token validity.

---

## **Authentication Milestone Status**

The authentication module now supports:

```text
Registration                  ✅
Email verification            ✅
Login                         ✅
JWT access tokens              ✅
JWT validation                 ✅
Protected routes               ✅
Global authentication guard   ✅
@Public() routes               ✅
Refresh tokens                 ✅
Refresh token hashing          ✅
Refresh token rotation         ✅
Refresh token revocation       ✅
Direct refresh-token lookup    ✅
Logout                         ✅
```

The authentication system is now ready for the next feature/security layer.

# Password Reset & Authentication Hardening

## Date

2026-09-12

## Milestone

Completed the remaining core authentication functionality by implementing the password reset flow.

The Auth module now supports:

* User registration
* Email verification
* Login with JWT access tokens
* Refresh-token sessions with rotation
* Logout
* Forgot-password flow
* Password reset with expiring, single-use tokens
* Session invalidation after password reset
* Global JWT authentication with `@Public()` exceptions
* Basic authentication hardening and TypeScript cleanup

---

## 22. Day 5 Objective

The main objective for Day 5 was to finish the remaining core authentication functionality and perform a hardening pass before moving to the User/Profile module.

The planned work was:

1. Implement forgot-password.
2. Implement password reset.
3. Make reset tokens secure and single-use.
4. Invalidate existing refresh sessions after a password change.
5. Review authentication edge cases.
6. Remove unnecessary TypeScript issues and redundant guards.
7. Test the complete password-reset flow.
8. Update project documentation.

---

## 23. Forgot-Password DTO

Created:

```text
src/auth/dto/forgot-password.dto.ts
```

The DTO accepts only the user's email address:

```typescript
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}
```

The `@IsEmail()` decorator ensures that malformed email input is rejected by the global `ValidationPipe`.

---

## 24. Forgot-Password Endpoint

Added the public endpoint:

```text
POST /auth/forgot-password
```

The endpoint accepts `ForgotPasswordDto` and delegates the operation to `AuthService`.

The route is marked with:

```typescript
@Public()
```

because password recovery must be available to users who are not currently authenticated.

The controller returns the result of the service call directly.

---

## 25. Forgot-Password Token Generation

When a matching account exists, the service generates a cryptographically random reset token:

```typescript
const resetToken = randomBytes(32).toString('hex');
```

The raw token is never stored in the database.

Instead, a bcrypt hash is generated:

```typescript
const resetTokenHash = await bcrypt.hash(resetToken, 12);
```

Only this hash is stored in the `User` record.

This follows the same security principle used for refresh tokens: credentials that can be used for authentication should not be stored in plaintext.

---

## 26. Password Reset Token Expiry

The reset token is given a one-hour validity period:

```typescript
passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
```

The database therefore stores both:

```text
passwordResetTokenHash
passwordResetExpiresAt
```

The token becomes unusable after its expiry time.

---

## 27. Preventing Account Enumeration

The forgot-password endpoint intentionally returns the same response whether or not the supplied email belongs to an account.

The response is:

```text
If an account exists for this email, a password reset link has been sent.
```

This prevents attackers from using the password-reset endpoint to discover which email addresses are registered on SkillShift.

The service therefore does not return an error simply because the email does not exist.

---

## 28. Password Reset Email

Added password-reset email functionality to:

```text
src/mail/mail.service.ts
```

The raw reset token is included in the reset URL sent to the user's email.

The current development URL points to the future frontend reset-password page:

```text
http://localhost:3001/reset-password
```

The frontend does not exist yet, so this URL is currently only a development placeholder for the eventual Next.js reset-password page.

The API itself receives the token and email when the reset operation is submitted.

---

## 29. Reset-Password DTO

Created:

```text
src/auth/dto/reset-password.dto.ts
```

The DTO contains:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
```

The new password must contain at least eight characters.

The token itself is required, while the email identifies the account whose reset token is being validated.

---

## 30. Reset-Password Endpoint

Added:

```text
POST /auth/reset-password
```

The endpoint is public:

```typescript
@Public()
@Post('reset-password')
```

This is necessary because the user does not have to possess a valid JWT access token to recover an account.

The reset token itself acts as the credential for this operation.

---

## 31. Reset Token Validation

The service first finds the user by email.

The reset request is rejected if:

* The user does not exist.
* No reset token hash exists.
* No reset expiry exists.
* The reset token has expired.

The validation logic is:

```typescript
if (
  !user ||
  !user.passwordResetTokenHash ||
  !user.passwordResetExpiresAt ||
  user.passwordResetExpiresAt <= new Date()
) {
  throw new BadRequestException('Reset token is invalid or expired.');
}
```

The same error message is used for invalid and expired reset tokens rather than exposing unnecessary information.

---

## 32. Comparing the Reset Token

The raw token received from the reset request is compared against the stored bcrypt hash:

```typescript
const match = await bcrypt.compare(
  resetPasswordDto.token,
  user.passwordResetTokenHash,
);
```

If the comparison fails:

```typescript
throw new BadRequestException(
  'Reset token is invalid or expired.',
);
```

The raw reset token is therefore never compared directly against a plaintext value stored in the database.

---

## 33. Updating the Password

After successful token validation, the new password is hashed using bcrypt:

```typescript
const newPasswordHash = await bcrypt.hash(
  resetPasswordDto.newPassword,
  12,
);
```

The plaintext password is never stored.

The user's `passwordHash` is then replaced with the new hash.

---

## 34. Making the Reset Token Single-Use

After a successful password reset, both reset-token fields are cleared:

```typescript
passwordResetTokenHash: null,
passwordResetExpiresAt: null,
```

This makes the reset token single-use.

Even if the same reset URL is submitted again, the database no longer contains a valid reset token hash, so the request is rejected.

---

## 35. Invalidating Existing Refresh Sessions

A password change is a security-sensitive event.

All existing refresh-token sessions are therefore deleted as part of the user update:

```typescript
refreshTokens: {
  deleteMany: {},
},
```

This prevents previously issued seven-day refresh tokens from continuing to create new access-token sessions after the password has been changed.

The behavior is therefore:

```text
Password reset
      ↓
Change password
      ↓
Invalidate reset token
      ↓
Delete existing refresh sessions
      ↓
User must log in again
```

The existing access JWT is not blacklisted.

As decided earlier, access tokens have a short lifetime of 15 minutes and remain valid until they expire.

---

## 36. Why Access Tokens Are Not Blacklisted

The project intentionally does not maintain an access-token blacklist.

The current authentication model is:

```text
Access Token
15 minutes
Stateless JWT
        +
Refresh Token
7 days
Database-backed
Hashed
Rotated
Revocable
```

Blacklisting every

**# User & Profile Module**

**## Date**

2026-09-13

**## Milestone**

Completed the User & Profile module according to the SkillShift Implementation Blueprint.

The User module now supports:

* Viewing the authenticated user's profile

* Updating the authenticated user's profile

* Viewing another user's public profile

* Public profile access without authentication

* Profile field validation

* Proper handling of nonexistent users/profiles

* Reusable authentication infrastructure through the shared `common` directory

**---**

**## 37. Day 6 Objective**

The main objective for Day 6 was to implement the User & Profile module following the Phase 2 requirements in the SkillShift blueprint.

The planned work was:

1. Create the User module.

2. Implement `UserService.findById()`.

3. Implement `UserService.updateProfile()`.

4. Implement `UserService.getPublicProfile()`.

5. Create the User controller.

6. Implement `GET /users/me`.

7. Implement `PATCH /users/me`.

8. Implement `GET /users/:id`.

9. Create `UpdateProfileDto`.

10. Make the public profile endpoint accessible without authentication.

11. Test profile retrieval, profile updates, validation, and public profile access.

12. Clean up reusable authentication infrastructure.

The blueprint defines Phase 2 as the User & Profile module containing these three service methods, three endpoints, the update DTO, and tests for updating/viewing profiles.

**---**

**## 38. User Module Creation**

Created the NestJS User module:

```text
src/user/
├── dto/
│   └── update-profile.dto.ts
├── user.controller.ts
├── user.controller.spec.ts
├── user.module.ts
├── user.service.ts
└── user.service.spec.ts
```

`PrismaModule` was added to `UserModule` so the User service can access the Prisma client.

The API uses the plural `/users` route structure specified by the blueprint.

**---**

**## 39. `GET /users/me`**

Implemented:

```text
GET /users/me
```

The endpoint retrieves the currently authenticated user's information using the user ID contained in the JWT payload.

The controller obtains the authenticated user from:

```typescript
req.user.sub
```

and passes the ID to:

```typescript
UserService.findById()
```

The endpoint is protected by the global JWT authentication guard.

A valid access token is therefore required.

**---**

**## 40. `UserService.findById()`**

Implemented:

```text
UserService.findById(userId)
```

The service queries the `User` record using its ID and returns the relevant account and profile information.

The response includes:

```text
User
├── id
├── email
├── role
├── isEmailVerified
├── createdAt
├── updatedAt
└── profile
    ├── id
    ├── displayName
    ├── bio
    ├── avatarUrl
    ├── skills
    ├── portfolioUrls
    ├── rating
    └── totalReviews
```

A Prisma `select` was used so that only explicitly required fields are returned.

Sensitive authentication information such as password hashes and refresh-token records is not exposed.

If the user does not exist, the service throws:

```text
NotFoundException
```

with:

```text
User not found
```

The endpoint was tested successfully through Postman and returned `200 OK`.

**---**

**## 41. `UpdateProfileDto`**

Created:

```text
src/user/dto/update-profile.dto.ts
```

The DTO supports updating:

```text
displayName
bio
avatarUrl
skills
portfolioUrls
```

Validation rules include:

```typescript
@MinLength(1)
@IsString()
displayName?: string;

@IsString()
bio?: string;

@IsUrl()
avatarUrl?: string;

@IsString({ each: true })
@IsArray()
skills?: string[];

@IsUrl({}, { each: true })
@IsArray()
portfolioUrls?: string[];
```

The fields are intended for partial updates because the endpoint uses HTTP `PATCH`.

System-managed fields such as:

```text
rating
totalReviews
```

are not accepted from the client.

**---**

**## 42. `PATCH /users/me`**

Implemented:

```text
PATCH /users/me
```

The endpoint obtains the authenticated user's ID from the JWT payload and passes the request body to:

```text
UserService.updateProfile()
```

The service updates the user's existing `Profile` record using the profile's unique `userId`.

The update operation was initially implemented using the wrong profile identifier. This was corrected from the profile's primary `id` to:

```text
Profile.userId
```

because the authenticated user's ID corresponds to the `userId` field on the Profile model.

This was an important distinction between:

```text
Profile.id
```

and:

```text
Profile.userId
```

The endpoint was tested successfully through Postman.

**---**

**## 43. Partial Update Validation**

During testing, a PATCH request containing only one field:

```json
{
  "displayName": ""
}
```

unexpectedly triggered validation errors for the other omitted fields.

The reason was that TypeScript's optional property syntax:

```typescript
field?: string
```

does not make a field optional to `class-validator` at runtime.

`@IsOptional()` was therefore added to the optional DTO fields.

The corrected validation behavior allows requests containing only the fields being updated while still validating those fields when they are supplied.

For example:

```json
{
  "displayName": ""
}
```

now correctly produces:

```text
400 Bad Request
```

because the supplied `displayName` violates:

```text
@MinLength(1)
```

while omitted fields are ignored.

**---**

**## 44. `GET /users/:id`**

Implemented:

```text
GET /users/:id
```

The endpoint calls:

```text
UserService.getPublicProfile()
```

using the requested user's ID.

Unlike `GET /users/me`, this endpoint returns only publicly appropriate profile information.

The response contains:

```text
displayName
bio
avatarUrl
skills
portfolioUrls
rating
totalReviews
```

Private account information such as email, role, authentication credentials, and session information is not returned.

**---**

**## 45. Making Public Profiles Accessible Without JWT**

The public profile endpoint was marked with:

```typescript
@Public()
```

This allows the global JWT authentication guard to bypass authentication for the endpoint.

The reusable `@Public()` decorator and JWT guard were moved into the shared `common` directory:

```text
src/common/
├── decorators/
│   └── public.decorator.ts
└── guards/
    └── jwt-auth.guard.ts
```

This is more appropriate because these components are application-wide authentication infrastructure rather than functionality specific to the Auth feature.

After updating the imports, the project compiled successfully.

**---**

**## 46. Public Profile Testing**

Tested:

```text
GET /users/:id
```

without an `Authorization` header.

The endpoint returned:

```text
200 OK
```

This confirmed that:

```text
Global JwtAuthGuard
        ↓
      @Public()
        ↓
Authentication bypassed
        ↓
Public profile returned
```

The endpoint therefore behaves as intended by the API design.

The blueprint explicitly defines `/users/:id` as the public user profile endpoint.

**---**

**## 47. Nonexistent Profile Handling**

Tested the public profile endpoint using a nonexistent UUID.

The API returned:

```text
404 Not Found
```

instead of returning:

```text
200 OK
null
```

This confirms that the service explicitly handles missing profiles using `NotFoundException`.

**---**

**## 48. TypeScript Verification**

After moving the common authentication infrastructure and updating all affected imports, the project was compiled using:

```bash
npx tsc --noEmit
```

The command completed with no output, confirming that TypeScript compilation succeeded without errors.

**---**

**## 49. Day 6 API Testing Summary**

The following User/Profile functionality was tested through Postman:

| Endpoint          | Test                  | Result            |
| ----------------- | --------------------- | ----------------- |
| `GET /users/me`   | Valid JWT             | `200 OK`          |
| `PATCH /users/me` | Profile update        | `200 OK`          |
| `PATCH /users/me` | Invalid `displayName` | `400 Bad Request` |
| `GET /users/:id`  | No JWT                | `200 OK`          |
| `GET /users/:id`  | Nonexistent user      | `404 Not Found`   |

The tests confirm that the main Phase 2 User/Profile behavior is functioning correctly.

**---**

**## 50. Phase 2 Completion**

The User & Profile module is considered complete according to the SkillShift Implementation Blueprint.

Implemented:

* `UserService.findById()`

* `UserService.updateProfile()`

* `UserService.getPublicProfile()`

* `GET /users/me`

* `PATCH /users/me`

* `GET /users/:id`

* `UpdateProfileDto`

* Public profile access using `@Public()`

* Profile validation

* Missing-profile error handling

* Postman endpoint testing

* TypeScript verification

No additional User/Profile functionality was added beyond the defined Phase 2 scope.

The blueprint's build sequence places User + Profile on Days 6–7, followed by the Wallet module on Days 8–9.

**---**

**## 51. Day 6 Outcome**

```text
Phase 2 — User & Profile
             ↓
          COMPLETE
             ↓
Next: Phase 3 — Wallet
```

The project is ready to proceed to the Wallet module.

# 2026-09-14 — Phase 3: Wallet Module

## Session

**Phase:** Phase 3 — Wallet
**Blueprint days:** Day 8–9
**Status:** Implemented and tested

Wallet was implemented as the first financial module of SkillShift.

The Blueprint defines three wallet operations:

* `getBalance`
* `deposit`
* `getTransactions`

with the following endpoints:

* `GET /wallet`
* `POST /wallet/deposit`
* `GET /wallet/transactions`

The Wallet module was implemented according to this design.

## Implementation

Created the Wallet module and registered it with the application.

### Wallet endpoints

#### `GET /wallet`

Returns the authenticated user's wallet.

The wallet is located using the `userId` obtained from the authenticated request rather than accepting a user identifier from the client.

#### `POST /wallet/deposit`

Accepts a deposit amount through `DepositDto`.

The deposit flow:

1. Identify the authenticated user's wallet.
2. Validate the requested deposit.
3. Increment the wallet balance.
4. Create a `DEPOSIT` transaction.
5. Perform the balance update and transaction creation inside a Prisma `$transaction`.
6. Return the updated wallet.

The wallet balance is incremented rather than using a read → calculate → write sequence.

This keeps the financial update safer under concurrent requests and ensures the wallet update and transaction record succeed or fail together.

The deposit is intentionally simulated. No real payment gateway is involved at this stage.

#### `GET /wallet/transactions`

Returns the authenticated user's wallet transactions.

Transactions are returned newest-first.

## Files Created

* `src/wallet/wallet.module.ts`
* `src/wallet/wallet.controller.ts`
* `src/wallet/wallet.service.ts`
* `src/wallet/dto/deposit.dto.ts`
* Wallet service specification file generated by Nest CLI

## Files Modified

* `src/app.module.ts`

## Database

No database schema changes were required.

The existing:

* `Wallet`
* `Transaction`

models were used.

The existing transaction type `DEPOSIT` represents simulated money deposited into a user's wallet.

## Architectural Decisions

### Authenticated user identity

Wallet operations use the authenticated `userId` rather than accepting a user ID from the request body.

This prevents clients from attempting to access or modify another user's wallet by supplying a different identifier.

### Centralized wallet lookup

Wallet retrieval is centralized in the wallet service.

This avoids duplicating the wallet lookup logic across wallet operations and provides a single place for wallet-not-found handling.

### Prisma transaction for deposits

The deposit operation updates the wallet balance and creates its transaction record inside one Prisma transaction.

A successful deposit therefore produces both:

* the updated wallet balance
* the corresponding `DEPOSIT` transaction

as one atomic operation.

### Increment instead of read-calculate-write

The wallet balance is incremented directly rather than first reading the balance, calculating a new value in application code, and writing the result back.

This reduces unnecessary application-side state handling and is more appropriate for concurrent financial updates.

### No Redis caching

Wallet balances and financial transaction data are deliberately not cached.

The Blueprint explicitly requires wallet balance to remain fresh because it represents financial state.

## Verification

### Build

`npm run build` passed successfully.

## Manual Testing & Debugging

Manual API testing was completed through Postman with **11 tests passed**.

The following areas were verified:

* Wallet retrieval
* Wallet deposits
* Balance updates after deposits
* Transaction history
* New-account wallet verification
* Invalid input handling
* Authentication requirements
* Multi-account data isolation

Three separate accounts were used to verify wallet and transaction isolation. Each account could access only its own wallet and transaction information.

A new-account verification flow was also tested successfully using the verification token obtained from the existing verification email.

No Wallet functionality issues were found during manual testing.

### Automated Testing Status

Automated testing was started but intentionally paused.

During setup of `wallet.service.spec.ts`, Jest/Prisma module-resolution configuration issues were encountered. These issues were debugged and resolved sufficiently for the initial test suite to load.

Meaningful automated Wallet unit testing remains deferred.

Automated testing is therefore **not considered completed** for the Wallet module.

### Current Wallet Testing Status

* Manual Postman testing: **Completed — 11 tests passed**
* Build verification: **Passed**
* Multi-account isolation: **Verified**
* Wallet functionality issues: **None found**
* Automated unit testing: **Paused/deferred**

**Next testing task:** Resume `wallet.service.spec.ts` automated unit testing.

## Deferred Foundation Work

The following cross-cutting work remains deferred:

* final global `ValidationPipe` configuration
* `GlobalExceptionFilter`
* consistent API response/error shape
* `@GetUser()` decorator
* meaningful AuthService unit tests
* broader automated testing
* security hardening

These items were not part of the Wallet implementation itself.



## Next Step

Proceed to Phase 4 — Service Listings.

Planned Service work includes CRUD, Redis caching, cursor-based pagination, ownership enforcement, admin moderation, and PostgreSQL full-text search.

# 2026-09-17 — Phase 4: Service Listings

## Session

**Phase:** Phase 4 — Service Listings
**Status:** Implemented and manually tested

The Service Listings module was implemented according to the Phase 4 requirements.

---

## Service CRUD

Implemented:

* `POST /services`
* `GET /services`
* `GET /services/:id`
* `PATCH /services/:id`
* `DELETE /services/:id`

Services belong to freelancers.

Create operations associate the service with the authenticated user's `userId` rather than accepting the freelancer ID from the client.

Update and delete operations verify that the authenticated freelancer owns the service.

---

## Cursor-Based Pagination

`GET /services` uses cursor-based pagination rather than offset pagination.

The implementation:

* defaults `limit` to 20
* caps the maximum limit at 50
* fetches `limit + 1` records to determine whether another page exists
* removes the extra record when necessary
* returns the last returned service ID as the next cursor
* uses `skip: 1` when continuing from a cursor

Services are ordered by `createdAt` descending.

The response contains:

```text
data
meta.cursor
meta.hasMore
```

Offset pagination was not introduced.

---

## Service Filtering

The service-list endpoint supports:

* skills
* minimum price
* maximum price

Only services with `deletedAt = null` are returned from the normal service listing.

Skills filtering uses the service's stored skills array.

Price filtering applies the provided minimum and/or maximum boundaries.

During manual testing, an invalid condition where `minPrice > maxPrice` returned an empty result rather than a `400` response.

This behavior was observed and intentionally left unchanged.

---

## Soft Deletion

Services use `deletedAt` for soft deletion.

The delete operation updates `deletedAt` rather than physically removing the database row.

Normal service retrieval and listing exclude deleted services.

This preserves service records that may later be referenced by historical domain data.

---

## Admin Moderation

Implemented:

* `PATCH /services/:id/approve`
* `PATCH /services/:id/reject`

Approval changes the service status to `ACTIVE`.

Rejection changes the service status to `REJECTED`.

The endpoints are protected by the application's authentication/RBAC mechanism.

---

## Redis Caching

Redis caching was added for:

### Individual service

```text
service:{serviceId}
```

### Service lists

```text
services:{query}
```

Service-list responses are cached with a one-hour TTL.

The individual service endpoint checks Redis before querying PostgreSQL.

The service-list endpoint similarly checks Redis before querying PostgreSQL.

PostgreSQL remains the source of truth.

---

## Cache Invalidation Bug

During manual testing, a stale `GET /services` list-cache issue was discovered.

The problem occurred because service mutations changed PostgreSQL data while previously cached service-list responses remained in Redis.

This meant a subsequent list request could return stale data.

The issue was fixed by invalidating service-list cache entries after mutations.

The following operations now invalidate:

* create
* update
* delete
* approve
* reject

Individual service cache entries are also invalidated where applicable.

---

## Redis `delByPattern()`

A reusable Redis helper was added:

```text
delByPattern(pattern)
```

The implementation uses Redis `SCAN` rather than `KEYS` to find matching keys.

For Service list-cache invalidation, the pattern is:

```text
services:*
```

The scan proceeds through Redis cursors and deletes matching keys.

This avoids relying on the blocking `KEYS` command for pattern-based cache invalidation.

---

## PostgreSQL Full-Text Search Infrastructure

Phase 4 also introduced the PostgreSQL infrastructure required for future full-text service search.

Added:

* `searchVector` (`tsvector`)
* GIN index
* `update_service_search_vector()` function
* `service_search_vector_trigger`

The trigger automatically populates the search vector when Service records are inserted or updated.

The search vector combines:

* title — weight A
* description — weight B
* skills — weight C

The actual SearchModule and `GET /search/services` endpoint were not implemented because they belong to Phase 10.

---

## Validation

The global `ValidationPipe` was configured with:

```text
transform: true
whitelist: true
forbidNonWhitelisted: true
```

This establishes the intended API-boundary validation behavior for the application.

---

## Testing & Verification

### Build

```text
npm run build
```

passed successfully.

### Manual Postman testing

Phase 4 manual testing covered:

* Service creation
* Service listing
* Individual service retrieval
* Service update
* Service deletion
* Authentication
* RBAC
* Freelancer ownership
* Admin approval
* Admin rejection
* Cursor pagination
* Skills filtering
* Price filtering
* Validation boundaries
* Redis caching
* Redis cache invalidation
* Deleted-service behavior

The Service module was manually verified through Postman.

### Cache Regression Testing

After discovering the stale list-cache issue, regression testing verified cache invalidation for:

* create
* update
* delete

The cache invalidation fix passed these regression tests.

---

## Git

The cache invalidation fix was committed and pushed with:

```text
fix: invalidate service list cache on mutations
```

The Service implementation and full-text-search migration were committed and pushed as separate commits.

Exact commit hashes were not recorded in the session handoff.

An unrelated `.gitignore` change involving `note.txt` was intentionally excluded from the Service commit.

---

## Known Deferred Work

### Registration role selection

The current registration DTO does not allow users to select their role.

New users therefore receive the default Prisma role (`CLIENT`).

A test account was manually promoted to `FREELANCER` for Service testing.

This issue is deferred and should be addressed separately.

### Automated testing

Automated Wallet testing was not part of this session.

Broader automated testing and hardening remain ongoing work.

---

## Phase 4 Status

Phase 4 Service Listings implementation and manual verification are complete.

The Service module is build-verified and manually tested.

The next implementation phase is Phase 5 — Orders.

# 2026-09-18 — Phase 5: Orders + Escrow

## Session

**Phase:** Phase 5 — Orders + Escrow
**Status:** Implementation complete and manually tested

Phase 5 implemented the Order and Escrow workflow connecting Services, client wallets, escrow state, freelancer payouts, and BullMQ-based automatic completion.

---

## Order Creation

Implemented:

```text
POST /orders
```

Order creation:

1. Validates the requested Service.
2. Prevents ordering inactive/deleted services.
3. Prevents a freelancer from ordering their own service.
4. Verifies sufficient client wallet balance.
5. Deducts the order amount from the client wallet.
6. Places the amount into escrow.
7. Creates the corresponding `ESCROW_HOLD` transaction.
8. Creates the Order.

The financial operations are handled atomically.

Insufficient client balance is rejected.

---

## Order Retrieval

Implemented:

```text
GET /orders/:id
```

The endpoint supports authenticated order access according to the Order authorization rules.

---

## Order Delivery

Implemented:

```text
PATCH /orders/:id/deliver
```

The freelancer is authorized to deliver the order.

The expected state transition is:

```text
IN_PROGRESS → DELIVERED
```

The endpoint verifies that the authenticated user is the freelancer associated with the order.

---

## Order Completion

Implemented:

```text
POST /orders/:id/complete
```

Completion is available to the client.

The completion flow:

1. Validates the order state.
2. Releases the escrowed amount.
3. Credits the freelancer wallet.
4. Creates an `ESCROW_RELEASE` transaction.
5. Marks the order as completed.

The resulting state transition is:

```text
DELIVERED → COMPLETED
```

Conditional state checks were added to prevent duplicate completion and duplicate payout.

---

## Order Cancellation

Implemented:

```text
POST /orders/:id/cancel
```

Cancellation supports the defined client/freelancer authorization paths.

Cancellation refunds the escrowed amount to the client and creates an:

```text
ESCROW_REFUND
```

transaction.

The escrow state is updated accordingly.

---

## Escrow

The Phase 5 financial flow is:

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

The Order/Escrow operations use database transactions for financial consistency.

---

## BullMQ Auto-Completion

Implemented a delayed BullMQ job for automatic order completion.

The normal delay is **7 days**.

The job uses the existing `REDIS_URL` configuration.

A deterministic job ID is used:

```text
order-{orderId}
```

This prevents duplicate auto-completion jobs for the same order.

The auto-completion flow performs:

```text
DELIVERED
    ↓
COMPLETED

Escrow HOLDING
    ↓
RELEASED

Freelancer wallet
    ↓
credited

ESCROW_RELEASE
    ↓
created
```

A system AuditLog is also created.

Because the operation is performed by the system rather than an authenticated user, the AuditLog stores:

```text
userId = null
```

Conditional state checks prevent the delayed job from performing a duplicate completion or payout if the order has already been completed through the normal client flow.

---

## Auto-Completion Testing

The 7-day delayed job was tested using a temporary 10-second trigger.

The temporary testing endpoint was removed after verification.

The test confirmed:

* `DELIVERED → COMPLETED`
* Escrow `HOLDING → RELEASED`
* Freelancer wallet credited
* `ESCROW_RELEASE` transaction created
* System AuditLog created with `userId = null`

---

## Authorization Testing

Manual testing covered both client and freelancer JWT authorization paths.

Verified cases included:

* freelancer delivery authorization
* client completion authorization
* client/freelancer cancellation paths
* protected Order endpoints
* prevention of unauthorized operations

---

## Validation / Business Rules Tested

The following negative cases were verified:

* insufficient client wallet balance
* inactive service
* deleted service
* client ordering their own service
* unauthorized Order operations

---

## Registration Role Fix

During Phase 5, the previously identified registration role gap was fixed.

Public registration now supports:

* `CLIENT`
* `FREELANCER`

`ADMIN` registration is rejected.

This removes the need to manually promote a newly registered test user to `FREELANCER` for normal Service testing.

---

## Testing

Order and Escrow functionality was manually tested using Postman with PostgreSQL verification.

The tested flows included:

* order creation
* escrow hold
* wallet deduction
* delivery
* completion
* escrow release
* freelancer payout
* cancellation
* escrow refund
* authorization
* invalid business conditions
* automatic completion

Manual verification passed.

Automated tests were intentionally deferred to the dedicated testing/hardening phase.

---

## Build

The implementation was build-verified successfully.

---

## Git

Latest Phase 5 implementation was committed and pushed:

```text
ca02912 — feat: add order auto-completion and audit logging
```

---

## Phase 5 Status

Phase 5 Order/Escrow implementation is complete.

Manual testing and database verification passed.

Automated testing remains deferred to the dedicated testing/hardening phase.

---

## Next Step

Proceed to Phase 6 — Notifications (BullMQ + email).

# 2026-09-20 — Phase 6: Notifications

## Session

**Phase:** Phase 6 — Notification Module
**Status:** Implementation complete and manually tested

Phase 6 implemented the notification infrastructure required by the Blueprint, including persistent notifications, BullMQ processing, email delivery, order-event notifications, authentication emails, and queue retry behavior.

---

## NotificationService

Implemented `NotificationService` with separate responsibilities for notification persistence and asynchronous processing.

### `create()`

Persists an in-app `Notification` record.

### `enqueue()`

Queues an application notification through BullMQ.

The queued notification can result in both persistent notification data and email processing.

### `enqueueEmail()`

Queues an email-only job.

This is used for authentication-related emails where an in-app notification record is not required.

---

## EmailProcessor

Implemented `EmailProcessor` to process notification-related BullMQ jobs.

The processor handles:

* `notification`
* `verification-email`
* `password-reset`

Email processing uses the existing mail infrastructure and email templates.

---

## Order Notification Events

Notification enqueueing was connected to Order state transitions.

Implemented notification events:

```text id="1q6s6b"
ORDER_PLACED
    ↓
freelancer

ORDER_DELIVERED
    ↓
client

ORDER_COMPLETED
    ↓
freelancer

ORDER_CANCELLED
    ↓
other order participant
```

The notification flow creates the required persistent Notification record and queues email processing where applicable.

---

## Authentication Email Events

Authentication email delivery was moved onto the Notification BullMQ infrastructure.

Implemented:

```text id="w7v2n1"
Registration
    ↓
verification email job
    ↓
EmailProcessor
    ↓
email delivery
```

and:

```text id="d7e4x9"
Forgot password
    ↓
password-reset email job
    ↓
EmailProcessor
    ↓
email delivery
```

This keeps email delivery asynchronous instead of performing it directly inside the request flow.

---

## Notification Queue

The Notification queue uses BullMQ.

The Blueprint-required queue configuration is:

```text id="r3c8z1"
attempts: 3

backoff:
  type: exponential
  delay: 5000ms

removeOnComplete: 100
removeOnFail: 500
```

The configuration was initially missing.

This was discovered during testing and corrected before Phase 6 was considered complete.

The final configuration is confirmed in commit `c3932cf9ca6b1ad874c683188f098cdd1276fe60`, which adds the required `defaultJobOptions` to the `NOTIFICATION` queue.

---

## Retry Testing

Retry behavior was deliberately tested by enqueueing a notification for a nonexistent user.

Redis was used to inspect the failed job.

The test verified:

* `atm = 3`
* `ats = 3`
* three stack traces were recorded
* final failure reason matched the expected nonexistent-user error

This verified that the configured retry behavior was actually being applied rather than merely existing in configuration.

---

## Email Delivery Testing

Actual emails were tested using Ethereal.

Verified:

* verification email delivery
* password-reset email delivery
* order notification email delivery

Email delivery was confirmed successfully.

---

## Temporary Test Code

A temporary Order endpoint/service method was added solely to enqueue the intentionally failing notification job used for retry testing.

The temporary test code was removed after testing.

It is not part of the intended production notification API.

---

## Build / Runtime Verification

The application build passed.

The NestJS application started successfully after the Phase 6 implementation.

---

## Deferred Notification Types

The Blueprint contains notification types whose corresponding application features are not yet implemented.

The following remain intentionally deferred:

* `DISPUTE_OPENED`
* `DISPUTE_RESOLVED`
* `MESSAGE_RECEIVED`
* `PAYMENT_RECEIVED`
* `REVIEW_RECEIVED`

No placeholder wiring was added.

These events will be connected when their respective modules/features are implemented.

---

## Git History

The Phase 6 implementation was developed through multiple commits.

Verified recent commits include:

```text id="3qv8k1"
bc6591b — feat: add notification email infrastructure
39a01e6 — feat: add order notification events
f79cc44 — feat: add notification and auth email jobs
b854562 — fix: enqueue order placed notification on creation
c3932cf — fix: configure notification queue retries
```

The retry configuration fix is the latest Phase 6 commit currently visible in repository history.

---

## Phase 6 Status

Phase 6 Notification implementation is complete.

Build verification passed.

Manual testing passed for notification persistence, order notification events, authentication emails, actual email delivery, and BullMQ retry behavior.

The Blueprint-required queue retry configuration is implemented and verified.

---

## Next Step

Proceed to Phase 7 — Dispute Module.


# 2026-09-21 — Phase 7: Dispute Module

## Session

**Phase:** Phase 7 — Dispute Module
**Status:** Implementation complete and manually tested

Phase 7 implemented the dispute workflow connecting clients, Orders, Escrow, Wallets, Transactions, AuditLogs, and Notifications.

---

## Dispute Module

Implemented `DisputeModule` with:

* dispute creation
* admin dispute listing
* admin dispute resolution

Controller endpoints:

```text
POST  /disputes
GET   /admin/disputes
PATCH /admin/disputes/:id/resolve
```

Authentication and role authorization use the existing project-wide authentication and roles infrastructure.

---

## Dispute Creation

Implemented `CreateDisputeDto`.

Only the client associated with an Order can create a dispute.

The creation flow validates:

1. The Order exists.
2. The authenticated user owns the Order as the client.
3. The Order is currently `IN_PROGRESS` or `DELIVERED`.

The dispute creation transaction then:

* creates the Dispute with status `OPEN`
* changes the Order status to `DISPUTED`
* creates a `DISPUTE_OPENED` AuditLog

These database changes occur inside one Prisma transaction.

---

## Dispute Notifications

After the dispute transaction succeeds, all users with the `ADMIN` role are retrieved.

A `DISPUTE_OPENED` notification is then queued individually for each admin.

The notification is deliberately queued **after** the transaction succeeds.

This prevents an admin notification from being generated for a dispute whose database transaction failed.

The current Notification model targets an individual `userId`, so admin notification fan-out is implemented as one notification job per admin rather than through a group-recipient abstraction.

---

## Admin Dispute Listing

Implemented:

```text
GET /admin/disputes
```

The endpoint is protected with the existing `ADMIN` role authorization.

The dispute listing includes:

* Order information
* Client information
* dispute data

Disputes are ordered newest-first.

---

## Dispute Resolution

Implemented `ResolveDisputeDto`.

Only administrators can resolve disputes.

Supported resolutions:

```text
RESOLVED_FREELANCER
RESOLVED_CLIENT
```

Before resolution, the service verifies:

* the Dispute exists
* the Dispute is still `OPEN` or `UNDER_REVIEW`
* the associated Escrow exists
* Escrow is currently `HOLDING`

---

## Resolution Transaction

Dispute resolution uses one Prisma transaction for the complete financial/state transition.

The transaction updates:

* Dispute
* Order
* Escrow
* Wallet
* Transaction
* AuditLog

This prevents partial financial resolution.

---

## Freelancer Resolution

For:

```text
RESOLVED_FREELANCER
```

the transaction performs:

```text
Dispute
  ↓
RESOLVED_FREELANCER

Order
  ↓
COMPLETED

Escrow
  ↓
RELEASED

Freelancer Wallet
  ↓
increment by escrow amount

Transaction
  ↓
ESCROW_RELEASE
```

A `DISPUTE_RESOLVED` notification is then queued for the freelancer after the transaction succeeds.

---

## Client Resolution

For:

```text
RESOLVED_CLIENT
```

the transaction performs:

```text
Dispute
  ↓
RESOLVED_CLIENT

Order
  ↓
REFUNDED

Escrow
  ↓
REFUNDED

Client Wallet
  ↓
increment by escrow amount

Transaction
  ↓
ESCROW_REFUND
```

A `DISPUTE_RESOLVED` notification is then queued for the client after the transaction succeeds.

---

## Concurrency Protection

Resolution uses conditional state updates.

The Dispute update only succeeds while the Dispute remains:

* `OPEN`
* or `UNDER_REVIEW`

Escrow is similarly updated only while it remains `HOLDING`.

If another request has already resolved the Dispute or changed the Escrow state, the update affects zero records and the operation is rejected.

This prevents duplicate dispute resolution and duplicate escrow release/refund under concurrent requests.

---

## Audit Logging

Two dispute-related audit events are recorded.

### `DISPUTE_OPENED`

Records the Order status transition:

```text
IN_PROGRESS / DELIVERED
        ↓
DISPUTED
```

The audit entry includes the authenticated client as `userId`.

### `DISPUTE_RESOLVED`

Records the Dispute status transition:

```text
OPEN / UNDER_REVIEW
        ↓
RESOLVED_FREELANCER / RESOLVED_CLIENT
```

The audit entry includes the resolving admin as `userId`.

No `disputeId` field was added to `AuditLog`.

The existing order/user-based audit structure is retained.

---

## Testing

Manual testing was completed successfully.

Verified:

* Client can open a dispute
* Freelancer cannot open a dispute
* Non-admin cannot resolve a dispute
* Admin can resolve for freelancer
* Admin can resolve for client
* Invalid resolution is rejected
* Already-resolved dispute is rejected
* Nonexistent Order is rejected
* Nonexistent Dispute is rejected
* Order state changes
* Escrow state changes
* Wallet balance changes
* Transaction creation
* AuditLog creation
* `DISPUTE_OPENED` notifications
* `DISPUTE_RESOLVED` notifications

PostgreSQL was used to verify financial and audit side effects.

Build verification passed.

Automated tests were not added during this phase and remain deferred to the dedicated testing/hardening phase.

---

## Deferred Work

The following remain outside Phase 7:

* Admin UI
* Real-time WebSocket notifications
* Notification-group abstraction
* Additional dispute workflow states beyond the current Blueprint/schema

---

## Phase 7 Status

Phase 7 Dispute Module implementation is complete.

Manual testing and database verification passed.

The module is build-verified.

Automated testing remains deferred.

---

## Next Step

Proceed to the next Blueprint phase after Disputes.


# 2026-09-22 — Supplemental Feature: Reviews/Ratings

## Feature Status

**Status:** Implemented + manually tested

Reviews/Ratings was implemented as a supplemental feature because the Blueprint defines the Review model, business rules, profile rating fields, and `REVIEW_RECEIVED` notification type, but does not provide a dedicated numbered implementation phase.

Official phase numbering therefore remains:

```text
Phase 7 — Disputes
        ↓
Supplemental Reviews/Ratings
        ↓
Phase 8 — Chat
```

Reviews/Ratings is not treated as Phase 8.

---

## Review Model / Direction

The implemented workflow is:

```text
Client
  ↓ reviews
Freelancer
```

The freelancer does not review the client under the current implementation.

The existing Review relationships are used:

```text
reviewerId → client
revieweeId → freelancer
serviceId  → purchased service
```

The existing Prisma constraint remains:

```text
orderId String @unique
```

This enforces one Review per Order.

No change was made to convert the uniqueness constraint to `(orderId, reviewerId)`.

---

## Review Creation

Endpoint:

```text
POST /reviews
```

Request fields:

```text
orderId
rating
comment?
```

The client does not provide:

* `reviewerId`
* `revieweeId`
* `serviceId`

These values are derived from the Order and authenticated user.

The service validates:

1. Order exists.
2. Authenticated user is the Order's client.
3. Order status is `COMPLETED`.
4. No existing Review exists for the Order.
5. Rating is within the valid range.
6. The reviewed user is the Order's freelancer.

---

## Review Transaction

Review creation and freelancer Profile statistics are handled within one Prisma transaction.

The transaction:

1. Creates the Review.
2. Retrieves the freelancer Profile.
3. Updates `totalReviews`.
4. Calculates the updated rating.
5. Updates `Profile.rating`.

The exact averaging formula is an implementation decision based on the meaning of `Profile.rating` and `Profile.totalReviews`. The Blueprint defines these fields but does not explicitly prescribe the aggregation formula.

---

## Notification Integration

After the Review transaction successfully commits:

```text
REVIEW_RECEIVED
```

is created/queued for the reviewed freelancer.

Notification processing occurs after the database transaction so a failed Review transaction does not produce a notification for a Review that was not committed.

---

## Review Module

The Review feature uses the following module structure:

```text
src/review/
├── dto/
│   └── create-review.dto.ts
├── review.controller.ts
├── review.service.ts
└── review.module.ts
```

`ReviewModule` is registered in `AppModule`.

Exact final repository state should remain the source of truth for any additional modified files.

---

## Testing

Manual testing successfully verified:

* Valid Review on a `COMPLETED` Order
* Duplicate Review rejection
* Rating `0` rejection
* Rating `6` rejection
* Rating `3.5` rejection
* Freelancer attempting to Review rejection
* Review on an `IN_PROGRESS` Order rejection
* Review persistence
* Freelancer Profile rating update
* Freelancer `totalReviews` update
* `REVIEW_RECEIVED` notification creation

Successful database state included:

```text
Review.rating = 5
Profile.rating = 5
Profile.totalReviews = 1
Notification.type = REVIEW_RECEIVED
Notification recipient = reviewed freelancer
```

The following were **not separately tested in the manual pass**:

* Non-existent Order
* Invalid comment type
* Optional comment omission
* Second-review aggregation
* Automated tests

These should not be marked as tested until they are actually verified.

---

## Blueprint Interpretation

The Blueprint explicitly provides:

* Review model
* `orderId @unique`
* `serviceId`
* `reviewerId`
* `revieweeId`
* rating/comment
* `Profile.rating`
* `Profile.totalReviews`
* `REVIEW_RECEIVED`
* completed-order requirement
* no-existing-review requirement

The Blueprint does not provide a dedicated numbered Reviews implementation phase.

Therefore Reviews/Ratings is documented as a **supplemental Blueprint-gap closure**, not as Phase 8.

The implementation also interprets the review direction as client → freelancer. This is an implementation decision rather than an explicitly stated Blueprint requirement.

The exact rating aggregation formula is likewise an implementation decision because the Blueprint does not explicitly prescribe one.

---

## Deferred Testing

Automated Review tests remain deferred to the dedicated testing/hardening phase.

Additional manual cases not covered in this pass also remain available for later verification.

---

## Next Step

Proceed to:

**Phase 8 — Chat Module**

# Phase 8 — Chat

## Feature Status

**Status:** Implemented + manually tested successfully

The Chat module was implemented using the existing NestJS, JWT, Redis, PostgreSQL, and Notification/BullMQ infrastructure.

No duplicate authentication, Redis, or notification infrastructure was introduced.

---

## WebSocket / Socket.IO Chat

The Chat gateway provides authenticated real-time communication for Order participants.

Implemented behavior:

* Socket JWT authentication
* Authenticated socket connections
* Order-specific rooms
* Participant authorization before joining an Order room
* Message sending
* `new_message` broadcast
* Safe socket disconnect handling

The authenticated user's identity is derived from the JWT rather than being supplied by the client.

---

## Message Persistence

Messages are persisted through the existing Chat service/database flow.

A successful message records:

* conversation/order association
* sender
* message content
* timestamp

The WebSocket layer therefore provides real-time delivery while PostgreSQL remains the persistent source of truth.

---

## REST Message History

Implemented:

```text
GET /chat/:orderId/messages
```

The endpoint:

* verifies Order participation
* returns message history
* supports cursor-based pagination

Cursor pagination was manually verified by requesting an initial page and then using the returned cursor to retrieve the next page.

---

## Redis Presence

Redis is used for Chat presence tracking.

Presence supports multiple simultaneous sockets for the same user.

Manual testing verified:

```text
1 socket  → presence 1
2 sockets → presence 2
3 sockets → presence 3
```

Disconnecting sockets correctly decremented the presence count.

This prevents a user with multiple active connections from being incorrectly considered offline when only one socket disconnects.

---

## Redis Message Rate Limiting

Chat message rate limiting was implemented using Redis.

The configured behavior tested during the manual pass was:

```text
10 messages → accepted
11th message → rejected
```

The rejection message was:

```text
Too many messages. Please slow down.
```

This provides application-level protection against excessive message sending.

---

## Message Notifications

Chat integrates with the existing Notification/BullMQ infrastructure.

A successfully sent message generates:

```text
MESSAGE_RECEIVED
```

for the other Order participant.

The notification integration reuses the existing notification system rather than introducing another queue or notification mechanism.

---

## Manual Testing

The following were manually verified successfully:

1. Socket JWT authentication
2. Missing/invalid JWT rejection
3. Safe unauthenticated disconnect handling
4. `join_order` authorization
5. Authorized participant joining
6. Unauthorized participant rejection
7. `send_message`
8. Message persistence
9. `new_message` broadcast
10. REST message history
11. Cursor pagination
12. Redis presence
13. Multiple simultaneous sockets
14. Redis message rate limiting
15. `MESSAGE_RECEIVED` notification

The manual test also verified that the application remained stable when unauthenticated sockets disconnected.

---

## Bug Fix

During testing, `handleDisconnect()` assumed that `client.user` was always present.

This assumption was invalid because a socket can disconnect before completing JWT authentication.

The resulting error was:

```text
TypeError: Cannot read properties of undefined (reading 'sub')
```

The disconnect handler was changed to safely handle sockets without an authenticated user.

The fix was committed and pushed:

```text
Commit: 0859aa0015d1719e1aff67c7f353bdd94d804ae0
Message: fix: handle unauthenticated chat disconnects
```

---

## Temporary Testing Artifacts

Manual Socket.IO testing used temporary scripts:

```text
test-chat.js
test-presence.js
```

These were testing utilities rather than Chat application functionality.

They should not be documented as permanent project files unless explicitly retained later.

`socket.io-client` was added to support the temporary manual Socket.IO testing workflow. Its final retained/dependency status should be determined from the repository before making a permanent dependency statement.

---

## Files / Areas

The Phase 8 implementation affected the following areas according to the implementation handoff:

```text
src/chat/
src/redis/redis.service.ts
src/auth/auth.module.ts
src/app.module.ts
package.json
package-lock.json
```

The exact final repository state remains the source of truth for individual file changes.

---

## Testing Scope

Phase 8 manual testing is complete.

This handoff does not establish completion of automated Chat tests. Automated testing remains part of the project's broader testing/hardening work.

---

## Next Step

Complete any remaining temporary testing dependency/file cleanup and proceed to the next Blueprint phase.

# Phase 9 — Uploads

## Feature Status

**Status:** Implemented + manually tested successfully

Phase 9 implements S3-based file uploads using presigned `PUT` URLs and upload confirmation.

The implementation supports multiple upload resources while keeping authorization and persistence within the existing application architecture.

---

## S3 Upload Flow

The upload flow is:

```text
Authenticated Client
        │
        ▼
Upload API
        │
        ├── authenticate JWT
        │
        ├── validate resource
        │
        ├── validate ownership
        │
        ├── validate filename
        │
        ├── validate file type / size
        │
        ▼
Generate presigned PUT URL
        │
        ▼
Client uploads directly to S3
        │
        ▼
Upload confirmation
        │
        ▼
S3 HeadObject verification
        │
        ▼
Persist application metadata
```

S3 therefore handles the file transfer while the SkillShift backend controls authorization, validation, confirmation, and persistence.

---

## Supported Upload Resources

The Upload module supports:

* avatar
* portfolio
* service images
* delivery files

The implementation uses the resource type to determine the relevant ownership and persistence behavior.

---

## Security / Validation

Upload requests are protected by JWT authentication.

Ownership checks are performed for protected resources.

The implementation also validates:

* filename/key information
* file type
* file size

Manual testing verified rejection of invalid file types and files larger than 5 MB.

---

## Upload Confirmation

Presigned URL generation does not by itself establish that the expected object was successfully uploaded.

The confirmation flow uses S3 `HeadObject` to verify the uploaded object before application persistence.

This separates:

```text
URL generation
```

from:

```text
successful upload confirmation
```

---

## Persistence

Different upload resources use the existing database models according to their purpose.

### Service images

Service uploads update:

```text
Service.imageUrls
```

Manual testing verified successful persistence of the uploaded service image information.

### Delivery files

Delivery uploads create:

```text
DeliveryFile
```

records.

`DeliveryFile` is created only for:

```text
resource = "delivery"
```

Manual testing verified successful `DeliveryFile` persistence.

---

## Database Changes

Added the `DeliveryFile` model and the corresponding `Order.deliveryFiles` relation.

Migration:

```text
20260926140735_add_delivery_file
```

The migration was applied successfully.

---

## Verification

Implementation verification:

```text
npm run build
```

Passed.

Prisma validation:

```text
npx prisma validate
```

Passed.

---

## Manual Testing

The following Upload functionality was manually tested successfully:

1. Presigned URL generation
2. S3 upload
3. Upload confirmation
4. Service ownership authorization
5. Delivery ownership authorization
6. Invalid file type rejection
7. File size rejection above 5 MB
8. `DeliveryFile` persistence
9. Service image persistence through `imageUrls`

No known Phase 9 manual-testing failure remains from this testing pass.

---

## Automated Testing

Required automated Upload tests were not run during this implementation/testing pass.

They remain deferred to the dedicated automated testing/hardening work.

This documentation therefore marks Phase 9 as **manually tested**, not fully automated-tested.

---

## Git / Working Tree

The testing handoff states that the working tree was clean and the relevant work was committed.

The exact Upload commit hash was not supplied in the handoff and is therefore not recorded here.

Do not invent a commit hash; obtain it from Git history when needed.

# Phase 10 — Search

## Feature Status

**Status:** Implemented + manually tested successfully.

Phase 10 adds the dedicated Search API using the PostgreSQL full-text-search infrastructure established during Phase 4.

---

## Search Module

Implemented:

```text
src/search/
├── SearchModule
├── SearchController
├── SearchService
└── SearchServicesDto
```

The module is registered with the application.

Endpoint:

```text
GET /search/services
```

---

## Search Implementation

Service search uses the existing PostgreSQL `Service.searchVector` field.

The Phase 4 database infrastructure is therefore reused rather than introducing another search mechanism.

The Search API supports:

* full-text query
* skills filtering
* minimum price filtering
* maximum price filtering

Only services satisfying the required visibility conditions are returned:

```text
Service.deletedAt IS NULL
Service.status = ACTIVE
```

---

## Pagination

Search results use cursor-based pagination.

Configured limits:

```text
default limit = 20
maximum limit = 50
```

However, manual testing identified an inconsistency between cursor pagination behavior and the current:

```text
createdAt DESC, id DESC
```

ordering.

This was **not changed during Phase 10 testing**.

Cursor pagination has therefore been explicitly deferred for later review.

It should not be documented as fully verified or as a resolved issue.

---

## Redis Caching

Search results are cached using Redis.

Configured TTL:

```text
120 seconds
```

Manual testing exercised the search caching behavior successfully.

Redis remains a performance layer; PostgreSQL remains the persistent source of truth.

---

## Database

No new Prisma schema changes were introduced for Phase 10.

The implementation reuses the existing:

```text
Service.searchVector
```

full-text-search infrastructure created during Phase 4.

---

## Build Verification

```text
npm run build
```

Passed.

---

## Manual Testing

The following areas were manually verified:

1. PostgreSQL full-text search by title/query
2. Skills filtering
3. Minimum/maximum price filtering
4. Active service visibility
5. Deleted service exclusion
6. Redis search caching

Two sample React services were activated directly in PostgreSQL for testing.

---

## Deferred Testing / Issues

Cursor pagination was tested but found inconsistent with the current `createdAt DESC, id DESC` ordering.

The issue was intentionally deferred rather than changing the implementation during this phase.

Automated Search tests were not reported as completed in the testing handoff and therefore remain unmarked here.

---

## Scope Boundary

Phase 10 implements the dedicated Search API.

The PostgreSQL `searchVector`, GIN index, and trigger were already introduced during Phase 4 and are reused here.

No duplicate search infrastructure was introduced.

# Phase 11 — Admin

## Feature Status

**Status:** Implemented + manually tested successfully.

Phase 11 introduces the Admin module for administrative analytics, user management, and service moderation.

---

## Admin Module

Implemented:

```text
AdminModule
AdminController
AdminService
```

Admin routes are protected using the existing role-based authorization mechanism:

```text
@Roles(Role.ADMIN)
```

Non-admin users are therefore prevented from accessing administrative endpoints.

---

## Endpoints

The Admin module exposes:

```text
GET   /admin/analytics

PATCH /admin/users/:id/disable

PATCH /admin/users/:id/enable

PATCH /admin/services/:id/moderate
```

---

## Analytics

The analytics endpoint provides:

* total orders grouped by status
* released escrow revenue
* top freelancers by rating
* dispute rate
* new users per day for the last 30 days

Analytics responses use Redis caching.

Redis key:

```text
admin:analytics:dashboard
```

Cache TTL:

```text
60 seconds
```

PostgreSQL remains the persistent source of truth.

---

## User Management

Admin users can disable and enable users.

Disabling a user uses the existing soft-delete mechanism and populates:

```text
deletedAt
```

Enabling a user restores:

```text
deletedAt = null
```

No separate user-status schema field was introduced.

---

## Service Moderation

The Admin module provides:

```text
PATCH /admin/services/:id/moderate
```

for service moderation.

Manual testing verified successful moderation to:

```text
REJECTED
```

The test service was subsequently restored to:

```text
ACTIVE
```

after testing.

---

## Build Verification

The implementation handoff reports:

```text
npm run build
```

passed.

---

## Manual Testing

Phase 11 manual testing successfully verified:

1. Non-admin access to admin routes
2. Admin analytics response
3. User disable
4. User enable
5. Service moderation
6. Restoration of the test service after moderation testing

Non-admin administrative access returned:

```text
403 Forbidden
```

Admin analytics returned:

```text
200 OK
```

Disposable/test users and services were used during testing, and the test fixtures were restored afterward.

---

## Automated Testing

Automated tests were skipped for Phase 11.

This is consistent with the manual-testing approach used for the preceding project phases.

The phase is therefore documented as **implemented + manually tested**, rather than automated-tested.

---

## Database Changes

No new Prisma/database schema changes were introduced during Phase 11.

The implementation uses the existing user soft-delete field and existing service/order/dispute/profile data.

---

## Scope

Phase 11 adds administrative operations without introducing a separate service or microservice architecture.

The existing NestJS monolith, PostgreSQL persistence, Redis caching, JWT authentication, and role-based authorization infrastructure are reused.
