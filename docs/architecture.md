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
                    │                      │
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


# Phase 4 — Service Listings Architecture

## Service Module

The Service module owns service listing operations:

```text
Client Request
      │
      ▼
ServiceController
      │
      ▼
ServiceService
      │
      ├── PostgreSQL
      │
      └── Redis
```

PostgreSQL remains the source of truth.

Redis is used as a performance layer for service reads.

---

## Service Ownership

Services belong to freelancers.

For mutations:

```text
JWT
 ↓
authenticated userId
 ↓
ServiceService
 ↓
verify freelancerId === userId
 ↓
update/delete
```

The client does not control the ownership identity through the request body.

This separates authentication from resource authorization.

---

## Service List Caching

The service list uses Redis keys based on the query:

```text
services:{query}
```

The individual service endpoint uses:

```text
service:{serviceId}
```

The list response is cached for one hour.

---

## Cache Invalidation

Service mutations invalidate cached service data.

```text
Create
   ↓
invalidate services:*

Update
   ↓
invalidate service:{id}
invalidate services:*

Delete
   ↓
invalidate service:{id}
invalidate services:*

Approve
   ↓
invalidate service:{id}
invalidate services:*

Reject
   ↓
invalidate service:{id}
invalidate services:*
```

A Redis `SCAN`-based helper performs pattern invalidation.

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

`SCAN` is used instead of `KEYS` so pattern-based invalidation does not depend on a blocking full-keyspace lookup.

---

## Cursor Pagination

Service listing uses cursor pagination:

```text
Request
GET /services?limit=20

             ↓

fetch 21 records
             ↓
21 records?
   │
   ├── yes → hasMore = true
   │         remove 21st record
   │
   └── no  → hasMore = false

last returned ID
        ↓
next cursor
```

The implementation does not use offset pagination.

---

## PostgreSQL Full-Text Search Infrastructure

Phase 4 adds the database infrastructure required for future Service search.

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

The trigger automatically updates the search vector when Service data is inserted or updated.

The actual search endpoint and SearchModule remain part of Phase 10.

---

## Architectural Boundary

Phase 4 establishes the database/search infrastructure without prematurely implementing the Phase 10 Search API.

This keeps the implementation aligned with the Blueprint's phased architecture.

# Phase 5 — Orders + Escrow Architecture

## Order / Escrow Flow

Phase 5 connects Services, client wallets, escrow, freelancer wallets, and transaction history.

```text
Client
  │
  │ POST /orders
  ▼
OrderService
  │
  ├── verify Service
  ├── verify client balance
  │
  ▼
Prisma Transaction
  │
  ├── deduct Client Wallet
  ├── create Order
  ├── create Escrow HOLDING
  └── create ESCROW_HOLD transaction
```

The financial state remains persisted in PostgreSQL.

---

## Completion Flow

```text
Client
  │
  │ POST /orders/:id/complete
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

The state transition is:

```text
DELIVERED → COMPLETED
```

The escrow transition is:

```text
HOLDING → RELEASED
```

---

## Cancellation Flow

```text
Client / Freelancer
        │
        │ POST /orders/:id/cancel
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

The refund keeps the wallet and transaction history consistent.

---

## Financial State

The Phase 5 financial relationship is:

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

PostgreSQL remains the source of truth.

Financial wallet data is not Redis-cached.

---

## BullMQ Auto-Completion

Orders that remain delivered are automatically completed after the configured 7-day delay.

```text
Order delivered
      │
      ▼
BullMQ delayed job
      │
      │ 7 days
      ▼
OrderAutoCompleteProcessor
      │
      ├── re-check Order state
      │
      ├── release Escrow
      │
      ├── credit Freelancer Wallet
      │
      ├── create ESCROW_RELEASE
      │
      ├── mark Order COMPLETED
      │
      └── create system AuditLog
                   │
                   └── userId = null
```

The job uses:

```text
order-{orderId}
```

as its deterministic BullMQ job ID.

---

## Duplicate Protection

The auto-completion flow performs conditional state checks before executing the financial transition.

This prevents an already-completed Order from being completed and paid out again.

The same principle applies to normal completion.

The database remains the authority for the current Order and Escrow state.

---

## System vs User Operations

Normal Order operations originate from authenticated users.

Automatic completion originates from the BullMQ worker.

```text
User request
    ↓
authenticated user
    ↓
OrderService
    ↓
financial operation
    ↓
AuditLog(userId)

BullMQ job
    ↓
system worker
    ↓
OrderService / financial operation
    ↓
AuditLog(userId = null)
```

This provides an audit distinction between user-triggered and system-triggered operations.

---

## Architectural Boundary

Phase 5 introduces Order/Escrow financial flows and background auto-completion.

Notifications remain a separate Phase 6 concern.

Search remains a Phase 10 concern.

The implementation continues to use the existing NestJS monolith, PostgreSQL, Redis, Prisma, and BullMQ architecture.

## Chat Architecture

SkillShift Chat is implemented inside the existing NestJS monolith using Socket.IO/WebSockets for real-time messaging.

```text
Authenticated Socket
        │
        ▼
   ChatGateway
        │
        ├── JWT authentication
        │
        ├── Order participant authorization
        │
        ├── Order room
        │
        ▼
   ChatService
        │
        ├── PostgreSQL
        │      └── persistent messages
        │
        └── NotificationService
               └── BullMQ → MESSAGE_RECEIVED

Redis
 ├── presence
 └── message rate limiting
```

PostgreSQL remains the persistent source of truth for messages.

Redis is used for ephemeral Chat concerns such as presence and rate limiting.

The existing Notification/BullMQ infrastructure handles asynchronous `MESSAGE_RECEIVED` notification processing.

Chat history is exposed through a REST endpoint with cursor-based pagination, while WebSockets provide real-time message delivery.
