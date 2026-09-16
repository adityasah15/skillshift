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
