# SkillShift — Project Checkpoint

**Last updated:** 2026-09-13
**Current day:** Day 6
**Next:** Day 8–9 — Wallet

## Completed

* Setup + PostgreSQL + Redis + Prisma + Docker
* Auth: register, email verification, login, JWT, refresh rotation, logout, forgot/reset password
* User/Profile: `GET /users/me`, `PATCH /users/me`, `GET /users/:id`
* `@Public()` + global `JwtAuthGuard`
* Profile validation + Postman testing
* TypeScript compilation passes

## Current Structure

```text
src/
├── auth/
├── common/
│   ├── decorators/public.decorator.ts
│   └── guards/jwt-auth.guard.ts
├── mail/
├── prisma/
└── user/
```

## Remaining Global Work

* Final `ValidationPipe` config (`whitelist`, `forbidNonWhitelisted`, `transform`)
* Global exception filter
* Consistent API response/error shape
* `@GetUser()` decorator
* Automated auth tests + later test coverage/hardening

## Next Feature

**Wallet**

* `getBalance()`
* `deposit()`
* `getTransactions()`
* `GET /wallet`
* `POST /wallet/deposit`
* `GET /wallet/transactions`

## Rules

* Blueprint = source of truth.
* User writes implementation; GPT guides/reviews/debugs.
* Don't mark discussed work as done unless implemented/tested.
* Don't redesign without a genuine architectural issue.
