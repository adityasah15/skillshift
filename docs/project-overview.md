# SkillShift — Complete Project Overview
## The "What, Why, Who, How" Before You Build

---

## 1. What Are You Actually Building?

SkillShift is a **freelance marketplace** — think Fiverr or Upwork,
but built by you, from scratch, with real engineering decisions.

A freelancer lists a service: "I'll build you a landing page for
₹2000, delivered in 3 days." A client finds it, pays — the money
goes into **escrow** (held safely, not released yet). The freelancer
delivers. Client accepts. Only then does money release to the
freelancer's wallet. If unhappy, client raises a **dispute**. Admin
decides who gets the money.

That's the core loop. Everything else supports this loop.

---

## 2. Who Uses It? (3 Roles)

**CLIENT** — browses, orders, pays, accepts/disputes, reviews

**FREELANCER** — lists services, delivers work, gets paid

**ADMIN** — moderates listings, resolves disputes, views analytics

One account = one role. Pick at registration. Admin assigned manually.

---

## 3. What Are We Building vs Skipping?

### Building:
- Auth (register, login, JWT, email verification)
- Service listings (CRUD, search, moderation)
- Order lifecycle + state machine
- Escrow (hold → release → refund)
- Wallet (deposit, balance, transactions)
- Real-time chat per order (WebSocket)
- Dispute management
- File uploads (S3)
- Email notifications (BullMQ queue)
- Admin panel (analytics, moderation)
- Minimal Next.js frontend (last phase)

### NOT Building (deliberately):
- Real payment gateway — wallet is simulated
- Mobile app, video calls, AI features, subscriptions

Why? Portfolio project = demonstrate backend depth, not build a startup.

---

## 4. Tech Stack and Why Each Piece

| Tool | Job | Why |
|------|-----|-----|
| NestJS | Backend framework | Structured, TypeScript, DI container |
| PostgreSQL | Primary database | Relational, ACID, safe for money |
| Prisma | ORM | Type-safe queries, migration system |
| Redis | Cache + queue backend | Fast reads + BullMQ needs it |
| BullMQ | Job queue | Background emails, delayed auto-complete |
| Docker | Runs DBs in containers | No local install, reproducible |
| AWS S3 | File storage | Never store files in DB |
| Next.js | Frontend | Added last, minimal |
| JWT | Auth tokens | Stateless, fast |

---

## 5. Architecture Mental Model

```
Browser
  │ HTTP (REST) + WebSocket (chat)
  ▼
NestJS API (port 3000) — your code, runs locally / on EC2
  ├── PostgreSQL (5432) — Docker — source of truth
  ├── Redis (6379)      — Docker — cache + queue backend
  │     └── BullMQ     — background jobs (emails, timers)
  └── AWS S3            — external — all file storage
```

NestJS doesn't store anything itself. It's just logic.

---

## 6. Module System

Each feature = one module (Controller + Service + DTOs)

```
AuthModule → UserModule → WalletModule → ServiceModule
→ OrderModule → EscrowModule → NotificationModule
→ DisputeModule → ChatModule → UploadModule
→ SearchModule → AdminModule
```

Modules don't reach into each other's internals. They import
and use each other's exported services.

---

## 7. Database Mental Model

```
User → Profile (display info)
User → Wallet → Transaction[] (money audit trail)
User → Service[] (if FREELANCER)
User → Order[] (as client or freelancer)

Order → Escrow (money held for this order)
Order → Dispute (if raised)
Order → Conversation → Message[] (chat)
Order → Review (after completion)
```

Key decisions:
- Price snapshotted on Order (freelancer price changes don't affect existing orders)
- Soft deletes (deletedAt, not actual DELETE)
- RefreshToken stored hashed (breach-safe)
- AuditLog append-only (reconstruct history of any event)

---

## 8. Order Lifecycle (Core of the App)

```
PENDING → (client pays) → IN_PROGRESS → (freelancer delivers) → DELIVERED
                                                                     │
                                              ┌──────────────────────┤
                                              │                      │
                                    Client accepts          Client disputes
                                              │                      │
                                         COMPLETED              DISPUTED
                                              │                      │
                                    Escrow released          Admin resolves
                                    Freelancer paid               │
                                                      ┌───────────┴───────────┐
                                                 Freelancer wins         Client wins
                                                  COMPLETED              REFUNDED
                                                 (escrow released)   (escrow refunded)

DELIVERED + 7 days silence → auto-COMPLETED (BullMQ delayed job)
PENDING or IN_PROGRESS → can be CANCELLED
```

---

## 9. Build Order (Why These Phases?)

```
Phase 0  Setup          → Project structure before anything
Phase 1  Auth           → WHO is making requests? Everything needs this
Phase 2  User+Profile   → Users need profiles before they do anything
Phase 3  Wallet         → Money system before orders
Phase 4  Services       → Listings before orders
Phase 5  Orders+Escrow  → Core feature. Most complex.
Phase 6  Notifications  → Orders trigger emails
Phase 7  Disputes       → About orders, needs order system
Phase 8  Chat           → Per order, needs orders
Phase 9  Uploads        → Enhancement, not core
Phase 10 Search         → Enhancement, not core
Phase 11 Admin          → Needs everything to administer
Phase 12 Polish+Tests   → Polish what exists
Phase 13 Deploy         → Deploy what works
Phase 14 Docs           → Document what's built
Phase 15 Frontend       → API first, always
```

Pattern: foundation → core → enhancements → polish → deploy

---

## 10. What "Done" Looks Like

**Live URL:** Register, browse services, order, chat, pay,
dispute, admin panel — all working, HTTPS, on AWS.

**GitHub repo:** Clean NestJS monolith, Prisma schema,
Docker setup, CI/CD pipeline, test suite, documentation.

**Interview answers:** You can explain every decision —
why JWT, why escrow needs DB transactions, why cursor
pagination, why Redis for both cache and queue, why
BullMQ for the 7-day timer, why soft deletes.

---

*This is your north star. Re-read at the start of every session.*
EOF
```

---

Now let me explain what we've already done in Phase 0 and **why**, so nothing feels blind:

---

**`npm install @nestjs/config @prisma/client ioredis` — why?**

Before writing any code we need the libraries. `@nestjs/config` lets us read `.env` variables in a typed, structured way instead of raw `process.env` everywhere. `@prisma/client` is the generated DB client — Prisma reads your schema and generates a type-safe client from it. `ioredis` is the Redis client for Node — it's what we'll use to talk to the Redis container.

**`npx prisma init` — why?**

This creates `prisma/schema.prisma` — the single file that describes your entire database. Every table, every column, every relationship lives here. Prisma reads this file and generates migrations (SQL) and the client. It also created `.env` with a `DATABASE_URL` placeholder.

**`docker-compose.yml` — why?**

Instead of installing PostgreSQL and Redis on your machine, Docker runs them in isolated containers. The compose file is just a config that says "when I run `docker compose up`, start these containers with these settings." The `volumes` line for postgres means the data survives even if you restart the container.

**`.env` DATABASE_URL — why that format?**

`postgresql://username:password@host:port/database` — that's the connection string format. `localhost:5432` works because Docker mapped the container's port 5432 to your machine's port 5432.

---

Now we're ready to actually write the schema. Go paste the full schema from Section 4 of the blueprint into `prisma/schema.prisma`.

Once done, come back and I'll explain every model before we run the migration. Don't run anything yet — read it first, ask questions.