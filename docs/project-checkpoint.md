# SkillShift — Project Checkpoint

**Last updated:** 2026-09-14

## Current State

**Current phase:** Phase 3 — Wallet
**Current day:** Day 8–9
**Status:** Wallet implemented and manually tested

---

## Completed

### Phase 0 — Project Setup

* NestJS project setup
* PostgreSQL + Redis
* Prisma
* Docker-based development environment
* Initial database schema and migration
* Config/Prisma foundation

### Phase 1 — Authentication

* User registration
* Email verification
* Login
* JWT authentication
* Refresh token rotation
* Logout
* Forgot password
* Reset password
* Global `JwtAuthGuard`
* `@Public()` decorator
* Authentication flows tested through Postman

### Phase 2 — User & Profile

* `GET /users/me`
* `PATCH /users/me`
* `GET /users/:id`
* Profile validation
* User/profile flows tested through Postman

### Phase 3 — Wallet

* Wallet module created and registered
* `GET /wallet`
* `POST /wallet/deposit`
* `GET /wallet/transactions`
* Wallet lookup using authenticated `userId`
* Deposit DTO validation
* Atomic wallet deposit using Prisma `$transaction`
* Deposit creates a `DEPOSIT` transaction
* Wallet balance incremented atomically
* Transactions returned newest-first
* TypeScript/build verification passed
* Manual Postman testing completed successfully

---

## Wallet Design

* Each user has one wallet.
* Wallet access is based on the authenticated user's JWT identity.
* `userId` is not accepted from the request body for wallet operations.
* Wallet lookup is centralized through the wallet service.
* Deposits update the wallet balance and create the corresponding transaction atomically.
* Wallet balance and transaction data are not Redis-cached because financial data must remain fresh.
* Existing `Wallet` and `Transaction` database models are used; no schema changes were required.

---

## Remaining Foundation Work

The following cross-cutting work remains:

* Final `ValidationPipe` configuration:

  * `whitelist`
  * `forbidNonWhitelisted`
  * `transform`
* `GlobalExceptionFilter`
* Consistent API response/error shape
* `@GetUser()` decorator
* Meaningful automated authentication tests
* Further automated testing and security hardening

These are foundation/polish items and do not block the completed Wallet implementation.

---

## Next Feature

### Phase 4 — Service Listings

Planned work:

* `ServiceService`

  * create
  * findAll
  * findOne
  * update
  * delete
* `ServiceController`
* Create/update DTOs
* Redis caching
* Cursor-based pagination
* Ownership enforcement
* Admin moderation endpoints
* PostgreSQL full-text search preparation
* Service CRUD, caching, pagination, and ownership testing

---

## Project Rules

* PostgreSQL is the persistent source of truth.
* Redis is used only where defined by the Blueprint.
* Financial data must not be cached.
* Ownership checks belong in the service layer.
* Multi-step financial operations must use Prisma transactions.
* Features are considered complete only after implementation and testing.
* Do not redesign the architecture without a genuine technical reason.
