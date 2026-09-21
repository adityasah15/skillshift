# Engineering Decisions Log

Format: Decision → Why → Alternatives considered → Trade-offs

---

## [D-001] WSL 2 as development environment on Windows

**Decision:** Use WSL 2 (Ubuntu) as the primary terminal, not PowerShell.

**Why:**
- Production servers run Linux
- Docker Desktop uses WSL 2 as its backend anyway
- Eliminates Windows-specific bugs (line endings, path separators,
  shell script compatibility)

**Alternatives considered:**
- PowerShell: Works for most things but causes friction with
  shell scripts and some npm packages
- Git Bash: Lighter but incomplete Linux emulation

**Trade-offs:**
- Small learning curve for WSL file system paths
- `code .` requires manual PATH setup in `.bashrc`

---

## [D-002] NestJS monolith over microservices

**Decision:** Single NestJS application, not microservices.

**Why:**
- Complexity of microservices (service discovery, network calls,
  distributed tracing) is not justified at this scale
- Monolith is easier to develop, debug, and deploy solo
- Can be split later if needed

**Alternatives considered:**
- Microservices: Over-engineered for a portfolio project
- Express: Less structure, no DI container, more boilerplate

**Trade-offs:**
- Scaling individual modules independently is harder
- Single point of failure

---

## [D-003] PostgreSQL + Redis in Docker, NestJS local

**Decision:** Run databases in Docker containers, NestJS directly on WSL.

**Why:**
- No need to install/manage PostgreSQL or Redis versions locally
- Containers are isolated and reproducible
- docker compose up = instant database environment
- NestJS runs locally for faster hot-reload during development

**Alternatives considered:**
- Everything in Docker including NestJS: Slower dev loop,
  hot-reload complexity
- Install PostgreSQL/Redis directly: Version conflicts,
  harder to reset/wipe

**Trade-offs:**
- Must have Docker Desktop running during development
- Port conflicts possible if something else uses 5432 or 6379





## [D-004] NestJS runs locally during development, not in Docker

**Decision:** Only PostgreSQL and Redis run in Docker during development.
NestJS runs directly on WSL with `npm run start:dev`.

**Why:**
- Faster hot reload (no volume mount overhead)
- Simpler debugging (direct process access)
- Dockerfile is a deployment artifact, not a development requirement
- Reduces cognitive load while learning NestJS architecture

**When does NestJS get containerized?**
Phase 13 (Deployment). The Dockerfile is written then, tested,
and used in the GitHub Actions CI/CD pipeline.

**Alternatives considered:**
- Containerize everything from Day 1: More reproducible but
  significantly slower dev loop and unnecessary complexity
  while the core features are still being built.

**Trade-off:**
- "Works on my machine" risk is slightly higher, but WSL
  standardizes the environment enough to mitigate this.

  ## 2026-09-21 — Dispute Resolution and Notification Decisions

### Atomic Dispute Financial Resolution

Dispute resolution changes multiple financial and domain records:

* Dispute
* Order
* Escrow
* Wallet
* Transaction
* AuditLog

These changes are executed inside a single Prisma transaction.

**Reason:** A dispute resolution represents one financial decision. Partial completion could leave the system with inconsistent financial state.

---

### Conditional State Updates for Resolution

Dispute and Escrow state updates use conditional database updates.

A Dispute can only be resolved while it is `OPEN` or `UNDER_REVIEW`.

Escrow can only be released/refunded while it is `HOLDING`.

**Reason:** This provides protection against concurrent resolution requests and prevents duplicate financial operations.

---

### Notifications After Successful Transactions

`DISPUTE_OPENED` and `DISPUTE_RESOLVED` notifications are queued only after their corresponding database transactions successfully complete.

**Reason:** Notifications describe committed state changes. Queueing them before the transaction succeeds could produce notifications for operations that later roll back.

---

### Individual Admin Notification Fan-Out

`DISPUTE_OPENED` is sent individually to every user with the `ADMIN` role.

**Reason:** The current Notification model targets an individual `userId` and does not provide a notification-group recipient abstraction.

A new group-recipient model was not introduced because the current requirement can be satisfied with individual notification jobs.

---

### Existing AuditLog Structure Retained

No `disputeId` field was added to `AuditLog`.

Dispute audit events continue using the existing order/user-based audit structure.

**Reason:** The current audit model is sufficient to record the relevant Order and Dispute state transitions without expanding the database schema unnecessarily.
