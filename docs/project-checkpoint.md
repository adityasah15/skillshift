# SkillShift — Project Checkpoint

**Last updated:** 2026-09-17

## Current State

**Current phase:** Phase 4 — Service Listings
**Current day:** Phase 4
**Status:** Service Listings implemented and manually tested

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

* Wallet module
* `GET /wallet`
* `POST /wallet/deposit`
* `GET /wallet/transactions`
* Authenticated wallet access
* Atomic deposits using Prisma `$transaction`
* `DEPOSIT` transaction creation
* Manual Postman testing completed
* 11 manual tests passed
* Multi-account wallet/transaction isolation verified

### Phase 4 — Service Listings

* `POST /services`
* `GET /services`
* `GET /services/:id`
* `PATCH /services/:id`
* `DELETE /services/:id`
* Cursor-based pagination
* Default pagination limit: 20
* Maximum pagination limit: 50
* Skills filtering
* Minimum/maximum price filtering
* Freelancer ownership enforcement
* Soft deletion using `deletedAt`
* Admin approve/reject
* Redis individual-service caching
* Redis service-list caching
* Redis cache invalidation after mutations
* Redis `SCAN`-based pattern deletion
* Global `ValidationPipe` configuration
* PostgreSQL full-text search infrastructure
* `searchVector` column
* GIN index
* PostgreSQL trigger/function for automatic `searchVector` population
* Service implementation build verification passed
* Manual Postman testing completed
* Cache invalidation regression tests passed for create, update, and delete

---

## Phase 4 Testing Status

Manual testing covered:

* CRUD
* authentication
* RBAC
* freelancer ownership
* admin approval/rejection
* cursor pagination
* skills filtering
* price filtering
* validation boundaries
* Redis caching
* Redis cache invalidation
* deleted-service behavior
* multi-user ownership boundaries

A stale service-list cache issue was discovered after mutations and fixed by invalidating `services:*` after create, update, delete, approve, and reject.

Invalid `minPrice > maxPrice` and invalid cursor values currently return empty results rather than `400`. This behavior was observed during testing and was intentionally not changed.

---

## Remaining Foundation Work

* Global exception filter
* Consistent API response/error shape
* `@GetUser()` decorator
* Meaningful automated AuthService tests
* Remaining automated testing and hardening

Automated Wallet testing remains deferred.

---

## Known Deferred Issue

Registration currently does not allow a user to select a role.

`RegisterDto` currently accepts:

* email
* password

New users therefore receive the default Prisma role (`CLIENT`).

A test account was manually promoted to `FREELANCER` for Service testing.

Role selection during registration is deferred.

---

## Next Feature

### Phase 5 — Orders

Proceed according to the Blueprint with the Order module and its required business rules, authorization, state transitions, transactions, and testing.

---

## Project Rules

* PostgreSQL is the persistent source of truth.
* Redis is used only where defined by the Blueprint.
* Financial data must not be cached.
* Ownership checks belong in the service layer.
* Multi-step financial operations must use Prisma transactions.
* Features are considered complete only after implementation and testing.
* Do not redesign the architecture without a genuine technical reason.
