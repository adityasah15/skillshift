# SkillShift Architecture

SkillShift is a two-sided marketplace for project-based freelance work: clients order services, the platform holds payment in escrow, and funds are released only when the work is approved. This document explains how the system is put together — the overall topology, backend modules, the money model, order and escrow flows, service listing infrastructure, realtime chat, uploads, and the production deployment.

## System Overview

SkillShift runs as a **modular NestJS monolith**: one deployable API application with explicit domain modules. A Next.js web app consumes it over HTTP for REST calls and Socket.IO for realtime chat.

```text
┌─────────────────────────────────────────────────┐
│              Next.js 16 · App Router            │
│                     (Vercel)                    │
└────────────────────────┬────────────────────────┘
                         │  HTTP / WebSocket
┌────────────────────────▼────────────────────────┐
│                 NestJS 11 API                   │
│                                                 │
│     Auth · User · Service · Order · Escrow      │
│     Wallet · Dispute · Review · Chat            │
│     Notification · Search · Upload · Admin      │
└────────┬─────────────────┬─────────────────┬────┘
         │                 │                 │
    ┌────▼─────┐      ┌────▼────┐      ┌─────▼─────┐
    │PostgreSQL│      │  Redis  │      │  AWS S3   │
    │  (data)  │      │cache +  │      │  (files)  │
    └──────────┘      │ queue + │      └───────────┘
                      │presence │
                      └────┬────┘
                       ┌───▼───┐
                       │BullMQ │
                       └───────┘
```

- **PostgreSQL** is the persistent source of truth for application, wallet, escrow, and audit data.
- **Redis** is a performance and coordination layer: cache-aside storage, rate limiting, presence counters, and BullMQ-backed jobs.
- **AWS S3** stores uploaded files; browsers upload directly with presigned URLs.
- **Realtime chat** runs inside the API process (Socket.IO), scoped to order rooms.

## Backend Modules

| Module | Responsibility |
| --- | --- |
| Auth | Registration, email verification, JWT sessions, password reset |
| User / Profile | Accounts, profiles, freelancer reputation fields |
| Wallet | Balances, deposits, withdrawals, transaction history |
| Service | Service listings, ownership, moderation states |
| Search | PostgreSQL full-text search over services |
| Order | Order lifecycle and status transitions |
| Escrow | Fund holding, release, and refund |
| Dispute | Conflict resolution and outcomes |
| Review | Ratings on completed orders |
| Notification | In-app notifications with queued email |
| Chat | Socket.IO gateway and message history |
| Upload | Presigned S3 uploads and confirmation |
| Admin | Moderation, analytics, dispute resolution |
| Infrastructure | Prisma and Redis modules, BullMQ processors |

## Wallet & Financial State

The Wallet module owns wallet operations:

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
        ├── Balance operation
        ├── Deposit ──► Prisma transaction
        │                 ├── Increment balance
        │                 └── Create DEPOSIT transaction
        └── Transaction history (newest first)
```

### Financial data rules

- Wallet balances and transaction records live in PostgreSQL and are never cached in Redis; financial state is always read fresh.
- Balances, service prices, order prices, escrow amounts, and transaction amounts are stored as **integers in minor units** (for example, `123` represents `1.23`). Fractional minor units are unsupported.
- The API accepts and returns amounts in minor units; clients convert them for display. No currency code is stored — the platform runs in a single currency.

### Atomic deposits

A deposit changes both the wallet balance and the transaction history:

```text
POST /wallet/deposit
        │
        ▼
   Prisma $transaction
        │
        ├── Increment wallet balance
        └── Create DEPOSIT transaction
```

Both writes commit together or not at all.

### Source-of-truth principle

Financial state remains in PostgreSQL. Redis is not used as the source of truth for wallet balances or transactions.

## Orders & Escrow

Placing an order debits the client wallet in the same database transaction that creates the order, the ledger entry, the audit event, and the escrow hold. A conditional balance predicate prevents concurrent requests from overdrawing the wallet.

### Order creation

```text
Client
  │  POST /orders
  ▼
OrderService
  │
  ├── verify Service
  ├── verify client balance
  ▼
Prisma Transaction
  │
  ├── deduct Client Wallet
  ├── create Order
  ├── create Escrow HOLDING
  └── create ESCROW_HOLD transaction
```

### Escrow lifecycle

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

Completion releases escrow to the freelancer; cancellation or a client-favouring dispute resolution refunds the client. Every financial state change runs in a Prisma transaction.

### Delivery & completion

```text
Client
  │  POST /orders/:id/complete
  ▼
OrderService
  │
  ▼
Prisma Transaction
  │
  ├── verify DELIVERED state
  ├── release Escrow
  ├── credit Freelancer Wallet
  ├── create ESCROW_RELEASE transaction
  └── mark Order COMPLETED
```

State transitions:

```text
Order:  DELIVERED → COMPLETED
Escrow: HOLDING   → RELEASED
```

### Cancellation

```text
Client / Freelancer
        │  POST /orders/:id/cancel
        ▼
   OrderService
        │
        ▼
 Prisma Transaction
        │
        ├── verify cancellation rules
        ├── refund Client Wallet
        ├── update Escrow → REFUNDED
        ├── create ESCROW_REFUND transaction
        └── update Order state
```

The refund keeps wallet balances and transaction history consistent.

### Disputes

Opening a dispute moves the order into `DISPUTED`. An admin resolves it in favour of the client (`RESOLVED_CLIENT`, escrow refunded) or the freelancer (`RESOLVED_FREELANCER`, escrow released). Each resolution updates the dispute, order, escrow, wallet, transaction, and audit records in a single Prisma transaction, guarded by conditional state updates: a dispute can only be resolved while `OPEN` or `UNDER_REVIEW`, and escrow can only move while `HOLDING`.

### Automatic completion

Orders that remain delivered are completed automatically after a 7-day delay.

```text
Order delivered
      │
      ▼
BullMQ delayed job
      │  7 days
      ▼
OrderAutoCompleteProcessor
      │
      ├── re-check Order state
      ├── release Escrow
      ├── credit Freelancer Wallet
      ├── create ESCROW_RELEASE
      ├── mark Order COMPLETED
      └── create system AuditLog (userId = null)
```

The job uses the deterministic ID `order-{orderId}`, so a re-queued order cannot schedule a duplicate completion.

### Duplicate protection

Auto-completion and manual completion perform conditional state checks before executing the financial transition, so an order that is already completed cannot be paid out twice. The database remains the authority for the current order and escrow state.

### System vs user operations

```text
User request                        BullMQ job
    ↓                                   ↓
authenticated user                 system worker
    ↓                                   ↓
OrderService / financial op        OrderService / financial op
    ↓                                   ↓
AuditLog(userId)                   AuditLog(userId = null)
```

Audit records therefore distinguish user-triggered from system-triggered operations.

## Service Listings

The Service module owns listing operations:

```text
Client Request
      │
      ▼
ServiceController
      │
      ▼
ServiceService
      │
      ├── PostgreSQL (source of truth)
      └── Redis (read cache)
```

Redis is a performance layer only; PostgreSQL remains authoritative.

### Ownership

Services belong to freelancers. Mutations derive ownership from the authenticated identity, never from the request body:

```text
JWT
 ↓
authenticated userId
 ↓
ServiceService
 ↓
verify freelancerId === userId
 ↓
update / delete
```

This separates authentication (who you are) from resource authorization (what you may change).

### List and detail caching

Versioned Redis keys:

```text
services:v2:{query}
service:v2:{serviceId}
```

Only `ACTIVE`, non-deleted services are returned by public list and detail reads. Versioned keys avoid reusing pre-moderation cache entries. List responses are cached for 5 minutes and detail responses for 10 minutes.

### Cache invalidation

Service mutations invalidate cached data:

```text
Create  → services:*
Update  → service:v2:{id}, services:*
Delete  → service:v2:{id}, services:*
Approve → service:v2:{id}, services:*
Reject  → service:v2:{id}, services:*, search:services:*
```

Pattern invalidation uses a `SCAN`-based helper rather than `KEYS`:

```text
delByPattern("services:*")
        │
        ▼
      SCAN
        │
        ▼
 matching keys
        │
        ▼
       DEL
```

`SCAN` avoids blocking the Redis keyspace during invalidation.

### Related cache policies

- **Search:** `search:services:{query}`, 2-minute TTL. Service mutations and moderation invalidate `search:services:*`.
- **Public profiles:** `profiles:freelancer:{userId}`, 10-minute TTL. Profile edits and new reviews invalidate the key.
- **Admin analytics:** `admin:analytics:dashboard`, 1-minute TTL. Successful order and dispute state changes delete the cached dashboard.

### Cursor pagination

Service listings use cursor pagination, never offset pagination:

```text
GET /services?limit=20
        │
        ▼
fetch limit + 1 records
        │
        ├── extra record → hasMore = true, drop it
        └── none         → hasMore = false
        │
        ▼
last returned ID → next cursor
```

### Full-text search

Search runs on PostgreSQL `tsvector` data maintained by a trigger:

```text
Service
 ├── title
 ├── description
 └── skills
       │
       ▼
PostgreSQL trigger
       │
       ▼
searchVector (tsvector)
       │
       ▼
GIN index
```

Search weights:

```text
title       → A
description → B
skills      → C
```

The trigger updates the search vector whenever service data is inserted or updated; the `Search` module queries it.

## Realtime Chat

Chat runs inside the existing monolith using Socket.IO:

```text
Authenticated Socket
        │
        ▼
   ChatGateway
        │
        ├── JWT authentication
        ├── Order participant authorization
        ├── Order room
        ▼
   ChatService
        │
        ├── PostgreSQL ── persistent messages
        └── NotificationService
               └── BullMQ → MESSAGE_RECEIVED

Redis
 ├── presence
 └── message rate limiting
```

PostgreSQL is the persistent source of truth for messages; Redis holds ephemeral chat state (presence counters and rate-limit windows). Notifications use the existing Notification/BullMQ pipeline. History is served over REST with cursor pagination, while WebSockets deliver messages in real time.

## File Uploads

Files are stored in AWS S3 and uploaded directly by the browser with presigned `PUT` URLs:

```text
Authenticated Client
        │
        ▼
   NestJS Upload API
        │
        ├── JWT authentication
        ├── ownership authorization
        ├── file validation
        ▼
Presigned S3 PUT URL
        │
        ▼
       S3
        │
        ▼
Upload confirmation
        │
        ▼
 S3 HeadObject
        │
        ▼
PostgreSQL metadata
```

The API is not the file-transfer path: S3 stores object bytes, PostgreSQL stores application metadata and relationships. Resource-specific persistence:

```text
Avatar / Portfolio  → Profile
Service images      → Service.imageUrls
Delivery files      → DeliveryFile → Order
```

The backend remains responsible for authentication, authorization, validation, presigned URL generation, and upload confirmation via `HeadObject`.

## Production Deployment

### Overview

The API is deployed as a Dockerized application on a single AWS EC2 instance, with Nginx as the public reverse proxy:

```text
                         Internet
                            │
                            ▼
                    DuckDNS hostname
                            │
                            ▼
                     Nginx :443
                  TLS termination
                            │
                            ▼
                  NestJS API :3000
                       │    │
              ┌────────┘    └────────┐
              ▼                       ▼
        PostgreSQL                  Redis
       persistent state       internal infrastructure
              │
              └──────────────┐
                             ▼
                            S3
                     uploaded files
```

The web app deploys independently to Vercel.

### AWS EC2

EC2 hosts the backend infrastructure. The instance runs the API container, PostgreSQL and Redis containers, and Nginx on the host. The NestJS application runs inside Docker.

### Docker

Docker packages the API as a production image. Docker Compose manages `postgres`, `redis`, and `api`. PostgreSQL uses a persistent volume, so database state is independent of the API container lifecycle.

### Nginx

Nginx is the public entry point: it terminates HTTPS, listens on ports 80/443, and reverse-proxies requests to the API on port 3000. The application container is not exposed directly.

### PostgreSQL

PostgreSQL is the persistent source of truth. The production database runs as a Docker container with persistent storage. Migrations are applied with:

```text
prisma migrate deploy
```

### Redis

Redis stays internal: caching, rate limiting, presence, and queue state. It is not a public endpoint.

### AWS S3

S3 stores files used by the Upload module. The application accesses it through the AWS SDK, using an EC2 IAM instance profile rather than hard-coded credentials.

### IAM

The EC2 instance assumes `SkillShiftEC2Role`, scoped to the S3 object operations the application needs:

```text
s3:PutObject
s3:GetObject
s3:DeleteObject
```

Bucket enumeration (`s3:ListAllMyBuckets`) is not granted.

### CI/CD

GitHub Actions validates every push and pull request and publishes the container image:

```text
Git push / pull request
     │
     ▼
GitHub Actions
     │
     ├── npm ci
     ├── Prisma generate
     ├── ESLint
     ├── Unit tests (coverage)
     ├── Integration tests
     ├── NestJS build
     └── Docker build
             │  (main branch only)
             ▼
        Docker Hub
             │
             ▼
        SSH → EC2
             │
             ├── docker compose pull
             ├── docker compose up -d
             └── docker image prune
```

The host pulls the published image instead of building it locally.

### HTTPS

HTTPS uses DuckDNS, Let's Encrypt, Certbot, and Nginx. The hostname is `skillshift-api.duckdns.org`; certificate renewal is automated.

- Live API: `https://skillshift-api.duckdns.org`
- Swagger UI: `https://skillshift-api.duckdns.org/api/docs`

### Non-goals

The deployment intentionally avoids microservices, Kubernetes, ECS/EKS, managed PostgreSQL/Redis, load balancing, autoscaling, multi-region deployment, infrastructure-as-code, a CDN, and a WAF. The goal is a realistic production-style deployment that matches the application's scale.
