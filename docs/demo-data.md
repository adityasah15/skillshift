# Demo Data

SkillShift ships a deterministic demo dataset for previewing the marketplace without creating records by hand. It is the dataset behind the public demo.

## Start the database

From the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
```

## Seed the demo records

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d skillshift < backend/prisma/demo-seed.sql
```

The seed is safe to re-run: it uses fixed IDs and upserts, so it refreshes the demo records instead of creating duplicates, and it never overwrites password hashes.

## Demo accounts

Every demo account uses the password `Demo1234!`.

| Role       | Email                        |
| ---------- | ---------------------------- |
| Client     | `client.one@skillshift.demo` |
| Client     | `client.two@skillshift.demo` |
| Freelancer | `maya@skillshift.demo`       |
| Freelancer | `noah@skillshift.demo`       |
| Freelancer | `zara@skillshift.demo`       |
| Freelancer | `leo@skillshift.demo`        |
| Freelancer | `tara@skillshift.demo`       |
| Freelancer | `kabir@skillshift.demo`      |
| Freelancer | `ananya@skillshift.demo`     |
| Freelancer | `dev@skillshift.demo`        |
| Admin      | `admin@skillshift.demo`      |

> The admin account is for local development. The demo password ships with the seed, so change the admin password after seeding any public deployment (see the [deployment runbook](deployment.md)).

## What the dataset contains

- 11 accounts: 2 clients, 8 freelancers, and 1 admin
- 30 service listings across all moderation states — 27 of them live in the public catalog
- 8 orders spanning in-progress, delivered, completed, disputed, and cancelled states
- Wallets with deposits, escrow holds, releases, refunds, and withdrawals
- Reviews, notifications, chat messages, disputes, escrows, and audit records

## Local URLs

- Web app: `http://localhost:3001`
- API: `http://localhost:3000` (Swagger: `/api/docs`)

## After reseeding

Marketplace lists are cached in Redis (services for 5 minutes, search for 2 minutes, profiles for 10 minutes). To see seed changes immediately, clear the cache on a local development machine:

```bash
docker compose exec -T redis redis-cli FLUSHDB
```

This also clears rate-limit counters and presence state, so only do it in development.
