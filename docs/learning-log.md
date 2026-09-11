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

---

# Prisma ↔ PostgreSQL Connectivity

## Date
2026-09-10

### 1. PrismaClient vs PrismaPg Adapter

- `PrismaClient` provides Prisma's database query API.
- `PrismaPg` connects Prisma to PostgreSQL through the PostgreSQL driver.
- The `pg` package provides the PostgreSQL driver.
- `DATABASE_URL` tells the application where the PostgreSQL database is located.

Conceptually:

```text
PrismaClient
    ↓
PrismaPg
    ↓
pg
    ↓
PostgreSQL
````

### 2. PrismaService

`PrismaService` extends `PrismaClient`, so it inherits Prisma's database methods.

Examples:

```typescript
this.user.findMany()
this.user.create()
this.user.update()
```

### 3. Raw SQL

Prisma provides:

```typescript
this.$queryRaw
```

for raw SQL that returns data.

Example:

```typescript
await this.$queryRaw`SELECT NOW()`;
```

`$executeRaw` is intended for raw SQL where returned rows are not the main result.

### 4. `const` Inside a Class

A standalone:

```typescript
const result = ...
```

cannot be placed directly inside a class body.

It must be inside a method/function:

```typescript
async testDatabase() {
  const result = ...;
}
```

### 5. `await`

Database queries are asynchronous.

Therefore:

```typescript
const result = await this.$queryRaw`SELECT NOW()`;
```

waits for PostgreSQL to return the result before continuing.

### 6. Smoke Testing

A smoke test is a minimal test used to verify that an important part of the system works.

`SELECT NOW()` was useful because it:

* requires no application data
* does not modify the database
* directly verifies database communication

The temporary endpoint was removed after verification.

### 7. Docker/WSL Debugging

The error:

```text
Can't reach database server at 127.0.0.1:5432
```

meant the application could not reach PostgreSQL.

Checking:

```bash
docker ps
```

showed whether the PostgreSQL container was running.

Restarting Docker Desktop restored Docker availability inside WSL.

### 8. Important Verification

Application startup alone does not prove that database queries work.

The successful:

```bash
curl http://localhost:3000/test-db
```

request proved the complete chain:

```text
NestJS
→ Prisma
→ PostgreSQL adapter
→ PostgreSQL
→ query result
→ HTTP response
```

### Key takeaway

**Initialize successfully ≠ database query verified.**

Always distinguish between:

1. Prisma can initialize.
2. PostgreSQL is reachable.
3. Prisma can execute a real query.
4. The actual application's database operations work.

```

These are designed to be **appended directly**, so you don't need to modify the earlier sections of either file.
```

# Learning Log — Authentication & Registration

## Date
2026-09-10

### 1. NestJS Module Structure

Feature modules follow:

```text
Module
├── Controller
└── Service
````

For SkillShift:

```text
AuthModule
├── AuthController
└── AuthService
```

Controller handles HTTP; Service handles business logic.

### 2. NestJS Dependency Injection

`AuthModule` imports `PrismaModule`.

`PrismaModule` exports `PrismaService`.

Therefore `AuthService` can inject:

```typescript
constructor(private readonly prismaService: PrismaService) {}
```

### 3. DTO

A DTO defines the expected request structure.

`RegisterDto` contains:

```text
email
password
```

`class-validator` decorators define validation rules.

### 4. ValidationPipe

Validation decorators alone don't execute validation.

NestJS needs:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

This enables validation globally.

### 5. HTTP Status Codes Learned

```text
400 → Bad Request / invalid input
409 → Conflict / resource already exists
```

Duplicate registration therefore uses `ConflictException`.

### 6. Password Security

Never store plaintext passwords.

Registration uses:

```typescript
bcrypt.hash(password, 12)
```

Database stores the resulting hash.

### 7. Prisma Transactions

A transaction groups multiple database operations into one atomic unit.

For registration:

```text
User + Profile + Wallet
```

must succeed together.

```text
all succeed → commit
one fails    → rollback
```

Inside the transaction callback, use the transaction client:

```typescript
tx.user.create()
tx.profile.create()
tx.wallet.create()
```

not the normal Prisma service.

### 8. Safe API Responses

Never return sensitive User fields such as:

```text
passwordHash
reset tokens
verification token hashes
```

Return only fields intended for the client.

### 9. curl

`curl` is a command-line HTTP client.

Common options:

```text
-X → HTTP method
-H → HTTP header
-d → request body
```

It can act as a simple replacement for a frontend while testing APIs.

### 10. Docker exec + psql

```bash
docker exec -it skillshift-postgres psql -U postgres -d skillshift
```

means:

```text
enter PostgreSQL Docker container
→ run PostgreSQL CLI
→ connect as postgres user
→ use skillshift database
```

Useful for directly inspecting the database.

### 11. Foreign Keys

A parent row cannot be deleted while child rows reference it unless cascading deletion is configured.

For our test data:

```text
User
 ↑
Profile
Wallet
```

So dependent records had to be removed before the User.

### 12. Testing Mindset

Test more than the happy path:

```text
valid registration       → success
duplicate email          → 409
invalid email/password   → 400
database records         → verify
cleanup                  → restore clean DB
```

### Key takeaway

**Registration is not just `User.create()`.**

It combines:

```text
DTO validation
+ business validation
+ password hashing
+ dependency injection
+ database transactions
+ relational integrity
+ safe API responses
```
## Email Verification

### What I Learned

- **SMTP** is the protocol/service interface used by applications to send email through a mail server.
- **Nodemailer** provides the Node.js API for configuring an SMTP connection and sending emails.
- A Nodemailer **transporter** represents the configured connection used to send messages.
- SMTP credentials should come from environment variables through NestJS `ConfigService`, not be hard-coded.
- **Ethereal** provides a development/test SMTP mailbox so email functionality can be tested without sending real emails.
- Verification tokens should be generated using a cryptographically secure random source such as `crypto.randomBytes()`.
- The raw verification token should not be stored in PostgreSQL. Store only a bcrypt hash.
- Bcrypt hashes cannot be looked up by hashing the same token again because bcrypt uses a random salt.
- `bcrypt.compare(rawToken, storedHash)` is the correct way to validate a stored bcrypt token.
- Verification tokens should be single-use. After successful verification, set `isEmailVerified = true` and clear the stored token hash.
- NestJS modules expose services through `exports` and consume them through `imports` and dependency injection.
- Authentication logic belongs in `AuthService`, while email-delivery mechanics belong in `MailService`.
- Email sending currently happens after the database transaction succeeds.
- For production, BullMQ can move email delivery to a background job with retries/backoff so SMTP failures do not directly block registration.

## Authentication — Login, JWT & Refresh Tokens

* **Login flow:** validate DTO → find user → `bcrypt.compare()` → check email verification → generate JWT.
* **JWT:** short-lived access token with `{ sub, email, role }`; current expiry = **15 minutes**.
* **Passport:** `JwtStrategy` verifies the token and returns the payload as `req.user`.
* **Typing:** use a `JwtPayload` type instead of `any`.
* **Global guard:** authentication is protected by default; `@Public()` explicitly bypasses the guard.
* **Refresh token:** generate cryptographically random token → return raw token to client → store only bcrypt hash in DB.
* **Refresh expiry:** **7 days**.
* **Rotation:** every successful refresh revokes the old refresh token and creates a new one.
* **Atomicity:** old-token revocation + new-token creation happen inside one Prisma transaction.
* **Security:** a tampered JWT is rejected; a rotated refresh token cannot be reused.
* **Database:** `revokedAt = NULL` means an active refresh session; a timestamp means the session has been revoked.
* **Current limitation:** refresh lookup scans active bcrypt hashes; optimize later with a lookup-friendly token identifier.
* **Important:** `npx tsc --noEmit` verifies type correctness, but API and database testing are still required for runtime verification.

### Authentication Mental Model

```text
Access Token
→ short-lived
→ sent with API requests
→ proves current authentication

Refresh Token
→ long-lived
→ used to obtain new access token
→ stored hashed
→ rotated after use
→ revocable
```

## Refresh Tokens — Optimization & Logout

* **Token format:** `tokenId.secret`
* **Lookup:** use `tokenId` for direct `RefreshToken` lookup instead of scanning all active hashes.
* **Security:** only `secret` is bcrypt-hashed; `tokenId` is a lookup identifier, not the credential.
* **Verification:** `findUnique(id)` → check revoked/expiry → `bcrypt.compare(secret, tokenHash)`.
* **Rotation:** every refresh revokes the old token and creates a new `tokenId.secret`.
* **Logout:** revoke only the current refresh-token session.
* **Authorization:** logout verifies `matchedToken.userId === req.user.sub`.
* **Access JWT:** not blacklisted; remains valid until its 15-minute expiry.
* **Reason:** short-lived stateless access JWT + revocable refresh session avoids maintaining an access-token blacklist.

