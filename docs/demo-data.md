# Local Demo Data

The local database includes a deterministic SkillShift demo dataset for previewing the marketplace without creating records manually.

## Start the database

From the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
```

## Seed the demo records

```bash
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d skillshift < backend/prisma/demo-seed.sql
```

The seed is safe to rerun. It uses fixed IDs and upserts, so it refreshes the demo records instead of creating duplicates.

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
| Admin      | `admin@skillshift.demo`      |

## Local URLs

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

The dataset includes active, pending, paused, and rejected services; orders in progress, delivered, completed, disputed, and cancelled states; wallets and signed transactions; reviews; notifications; chat messages; disputes; escrows; and audit records.
