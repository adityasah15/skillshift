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

## Showcase trio: the full order lifecycle

Three accounts demonstrate the complete order lifecycle end to end — order → delivery → release, or dispute → admin resolution (all with password `Demo1234!`):

| Role       | Email                        | What it brings to the demo |
| ---------- | ---------------------------- | -------------------------- |
| Client     | `client.one@skillshift.demo` | Funded wallet (₹1,25,003) and orders across in-progress, delivered, completed, and cancelled states |
| Freelancer | `maya@skillshift.demo`       | Four live services plus one awaiting moderation, including "Brand identity starter kit" (₹29,999), and completed-order history |
| Admin      | `admin@skillshift.demo`      | Platform analytics, the moderation queue, and dispute resolution — release escrow to the freelancer or refund the client |

### Suggested demo flow

1. **Order** — as `client.one`, order Maya's "Brand identity starter kit" (₹29,999 / `2999900` minor units) with requirements. The order starts `IN_PROGRESS` and the wallet shows the escrow hold. The pre-seeded in-progress order between the same two accounts works as a shortcut.
2. **Deliver** — as `maya`, deliver from the Order Cockpit with a note. The order becomes `DELIVERED` and a 7-day auto-complete clock starts.
3. **Complete** — as `client.one`, approve the delivery. Escrow is released to Maya, both parties are notified, and the client can leave a review afterwards.
4. **Dispute variant** — instead of completing, the client can open a dispute on a delivered order (order becomes `DISPUTED`, escrow stays held). As `admin`, resolve it under `/admin/disputes`: `RESOLVED_FREELANCER` releases escrow to the freelancer, `RESOLVED_CLIENT` refunds the client.
5. **Admin extras** — approve or reject Maya's "Design system audit" listing in the moderation queue, and resolve the pre-seeded open dispute between `client.two` and `zara`.

> Sign the three accounts in through separate browser profiles or incognito windows: the refresh cookie is per-browser, so two accounts in one profile overwrite each other's session.

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
