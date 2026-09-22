<p align="center">
  <!-- Replace src with your actual logo path once you have one -->
  <!-- <img src="assets/logo.png" alt="SkillShift Logo" width="160"> -->
</p>

<h1 align="center">SkillShift</h1>

<p align="center">
  <strong>Production-oriented freelance marketplace backend built with NestJS</strong>
</p>

<p align="center">
  Authentication · Escrow · Orders · Real-time Chat · Search · Atomic Transactions
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Active%20Development-orange" alt="Status">
  &nbsp;
  <img src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white" alt="NestJS">
  &nbsp;
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  &nbsp;
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  &nbsp;
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  &nbsp;
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis">
</p>

---

SkillShift models the core workflows of a real freelance platform including authentication & sessions, service listings, orders, escrow-based payments, disputes, real-time chat, notifications, search, and file uploads. The focus is on real production concerns: data integrity, state machines, atomic transactions, caching, background jobs, and observability.

---

## Why this project exists

Most marketplace tutorials stop at basic CRUD.

SkillShift focuses on the harder parts of backend engineering that actually matter in production systems:

- **Financial atomicity** — wallet deduction, order creation, and escrow funding happen inside a single Prisma `$transaction`
- **Strict state machines** for Orders and Escrow (invalid transitions are rejected in the service layer)
- **Refresh-token rotation + revocation** with hashed tokens stored in the database
- **Cursor-based pagination**, Redis cache-aside, and BullMQ delayed jobs (e.g. 7-day auto-complete)
- **Append-only audit logs** that capture before/after state for every critical transition
- **Presigned S3 uploads** so the API never handles file bytes
- **Ownership checks + RBAC** enforced consistently across modules

The goal is to demonstrate solid backend engineering judgment through a realistic, end-to-end system.

---

## Architecture

Modular monolith. PostgreSQL is the source of truth. Redis is used for caching and as the BullMQ backend. File storage lives on S3. WebSockets run inside the same NestJS process.

```text
┌─────────────────────────────────────────────────┐
│                 Next.js Frontend                │
│                  ( App Router)                  │
└────────────────────────┬────────────────────────┘
                         │  HTTP / WebSocket
┌────────────────────────▼────────────────────────┐
│               NestJS API Server                 │
│                                                 │
│     Auth · User · Service · Order · Escrow      │
│     Wallet · Dispute · Chat · Notification      │
│     Search · Upload · Admin                     │
└────────┬─────────────────┬─────────────────┬────┘
         │                 │                 │
    ┌────▼─────┐      ┌────▼────┐      ┌─────▼─────┐
    │PostgreSQL│      │  Redis  │      │  AWS S3   │
    │  (data)  │      │cache +  │      │ (files)   │
    └──────────┘      │  queue  │      └───────────┘
                      └────┬────┘
                       ┌───▼───┐
                       │BullMQ │
                       └───────┘
```

**Key decisions**
- Single NestJS monolith (no microservices for this scope)
- Business rules live in the service layer; controllers stay thin
- Soft deletes on User and Service
- Price snapshot on Order so later price changes never affect existing orders
- Refresh tokens stored as hashes — a DB leak does not immediately compromise sessions

---

## Tech Stack

| Layer              | Technology                                      |
|--------------------|-------------------------------------------------|
| Runtime            | Node.js + NestJS + TypeScript                   |
| Database & ORM     | PostgreSQL + Prisma                             |
| Cache & Queues     | Redis + BullMQ                                  |
| Auth               | JWT (access) + rotating refresh tokens (hashed) |
| File Storage       | AWS S3 (presigned URLs)                         |
| Email              | Resend / Nodemailer (via BullMQ)                |
| Real-time          | NestJS WebSocket Gateway (Socket.IO)            |
| Search             | PostgreSQL full-text (`tsvector`)               |
| Infrastructure     | Docker, Docker Compose, Nginx                   |
| Frontend           | Next.js 14 App Router                           |

---

## Core Features (planned / in progress)

### Authentication & Security
- Registration + email verification
- JWT access tokens (short-lived)
- Refresh-token rotation and revocation
- Password reset with full session invalidation
- Global auth guard + `@Public()` opt-out
- Role-based access control (CLIENT / FREELANCER / ADMIN)

### Marketplace
- Freelancer profiles & service listings
- Service discovery + full-text search
- Order lifecycle with delivery workflow
- Reviews & ratings

### Payments (simulated)
- Wallet system
- Escrow hold → release / refund
- All money movements logged as transactions
- Atomic financial operations via Prisma transactions

### Communication
- Order-scoped conversations
- Real-time messaging (WebSockets)
- Persisted history + online status (Redis)
- In-app + email notifications

### Platform
- Admin moderation & dispute resolution
- Audit logs for critical state changes
- Rate limiting on sensitive endpoints
- Cursor-based pagination everywhere

---

## Project Structure

```text
skillshift/
├── prisma/
│   └── schema.prisma          # Single source of truth for the data model
├── src/
│   ├── auth/                  # Registration, login, refresh, password reset
│   ├── user/
│   ├── service/               # Freelancer service listings
│   ├── order/
│   ├── escrow/                # State machine for funds
│   ├── wallet/
│   ├── dispute/
│   ├── chat/                  # WebSocket gateway + message history
│   ├── notification/          # BullMQ email + in-app notifications
│   ├── upload/                # S3 presigned URLs
│   ├── search/
│   ├── admin/
│   ├── common/                # Guards, filters, interceptors, decorators
│   ├── config/
│   ├── prisma/
│   └── redis/
├── docs/                      # Architecture, decisions, API conventions
├── docker-compose.yml
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker

### 1. Clone & install
```bash
git clone https://github.com/adityasah15/skillshift.git
cd skillshift
npm install
```

### 2. Start infrastructure
```bash
docker compose up -d
```
This brings up PostgreSQL and Redis.

### 3. Environment
```bash
cp .env.example .env
```
Copy the example env and fill in the required values (database URL, Redis, JWT secrets, etc.).

### 4. Database
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Run the API
```bash
npm run start:dev
```

Once the server is running:

- API → `http://localhost:3000`
- Swagger docs → `http://localhost:3000/api`

> Live production URL will be added here after deployment.

---

## Implementation Status

* [x] Project setup & Docker infrastructure
* [x] Database schema (Prisma)
* [x] Authentication (registration, verification, JWT, rotation, logout, password reset)
* [x] User / Profile module
* [x] Wallet
* [x] Service marketplace
* [x] Orders
* [x] Escrow
* [x] Notifications (BullMQ + email)
* [x] Disputes
* [x] Reviews
* [ ] Real-time chat
* [ ] File uploads (S3 presigned)
* [ ] Search
* [ ] Admin module & analytics
* [ ] Automated tests (unit + integration)
* [ ] Next.js frontend
* [ ] CI/CD + production deployment (Docker → AWS EC2 + Nginx)

See `docs/` for the full implementation blueprint and engineering decisions.

---

## Engineering Focus

This project prioritizes:

- Correctness of financial and order state transitions
- Clear ownership and authorization boundaries
- Consistent API shape and error handling
- Observability (request logging + audit trail)
- Developer experience (Docker one-command infra, typed config, Swagger)

It intentionally avoids microservices, real payment gateways, and heavy frontend work until the backend core is solid.

---

## Documentation

Detailed notes on architecture, API conventions, design decisions, and implementation live in the [`docs/`](docs/) folder.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

**Built as a deliberate exercise in production-grade NestJS backend design.**
