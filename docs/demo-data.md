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

The seed is safe to re-run: it uses fixed IDs and upserts, so it refreshes the demo-owned rows in place instead of creating duplicates. It never overwrites password hashes, and user-created records beyond the seed are left untouched.

## Demo accounts

Every demo account uses the password `Demo1234!`.

| Role       | Email                        |
| ---------- | ---------------------------- |
| Client     | `client.one@skillshift.demo` |
| Client     | `client.two@skillshift.demo` |
| Client     | `priya@skillshift.demo`      |
| Client     | `daniel@skillshift.demo`     |
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
| Client     | `client.one@skillshift.demo` | Funded wallet (₹1,82,011) and orders spanning in-progress, delivered, completed, cancelled, and refunded states |
| Freelancer | `maya@skillshift.demo`       | Four live services plus two awaiting moderation, including "Brand identity starter kit" (₹29,999), and a deep completed-order history |
| Admin      | `admin@skillshift.demo`      | Platform analytics, a four-item moderation queue, and dispute resolution — release escrow to the freelancer or refund the client |

### Suggested demo flow

1. **Order** — as `client.one`, order Maya's "Brand identity starter kit" (₹29,999 / `2999900` minor units) with requirements. The order starts `IN_PROGRESS` and the wallet shows the escrow hold. The pre-seeded in-progress order between the same two accounts works as a shortcut.
2. **Deliver** — as `maya`, deliver from the Order Cockpit with a note. The order becomes `DELIVERED` and a 7-day auto-complete clock starts.
3. **Complete** — as `client.one`, approve the delivery. Escrow is released to Maya, Maya is notified, and the client can leave a review afterwards.
4. **Dispute variant** — instead of completing, the client can open a dispute on a delivered order (order becomes `DISPUTED`, escrow stays held). As `admin`, resolve it under `/admin/disputes`: `RESOLVED_FREELANCER` releases escrow to the freelancer, `RESOLVED_CLIENT` refunds the client.
5. **Admin extras** — approve or reject one of Maya's two pending listings in the moderation queue, and resolve the pre-seeded open dispute between `client.two` and `zara`.

> Sign the three accounts in through separate browser profiles or incognito windows: the refresh cookie is per-browser, so two accounts in one profile overwrite each other's session.

## What the dataset contains

- 13 accounts: 4 clients, 8 freelancers, and 1 admin
- 33 service listings across all moderation states — 27 live, 4 awaiting moderation, 1 rejected, and 1 paused
- 39 orders spanning in-progress, delivered, completed, disputed, cancelled, and refunded states
- 32 reviews, with every live service reviewed at least once
- 2 disputes: one open and one resolved in the client's favour
- 13 conversations and 36 chat messages
- 24 notifications and 101 audit records on one chronological timeline
- Wallets with deposits, escrow holds, releases, refunds, and withdrawals whose ledgers reconcile to the available balances

Freelancer `rating` and `totalReviews` are recomputed from the `Review` rows at the end of the seed, so reputation and review history always agree.

## Local URLs

- Web app: `http://localhost:3001`
- API: `http://localhost:3000` (Swagger: `/api/docs`)

## After reseeding

Marketplace lists are cached in Redis (services for 5 minutes, search for 2 minutes, profiles for 10 minutes). To see seed changes immediately, clear the cache on a local development machine:

```bash
docker compose exec -T redis redis-cli FLUSHDB
```

This also clears rate-limit counters and presence state, so only do it in development.
