# Deployment

SkillShift deploys as two independent pieces:

| Piece | Where | Live URL |
| --- | --- | --- |
| API (NestJS, Postgres, Redis) | AWS EC2 + Nginx + Docker Compose | `https://skillshift-api.duckdns.org` (Swagger: `/api/docs`) |
| Web app (Next.js) | Vercel | `https://skillshift-live.vercel.app` |

See `docs/architecture.md` ("Production Deployment") for the topology diagram
and rationale.

## Backend (EC2 + Nginx + Docker Compose)

### Automatic deploys (CI)

`.github/workflows/ci.yml` runs on every push/PR: Prisma generate → ESLint →
unit tests → e2e tests → build → Docker image. On a push to `main` it then:

1. pushes the image to Docker Hub,
2. SSHes into the EC2 host and runs:

```bash
cd ~/skillshift
docker compose pull api
docker compose up -d api
docker image prune -f
```

Required GitHub secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`,
`EC2_USERNAME`, `EC2_SSH_KEY`.

### Server layout

- App directory: `~/skillshift` (Compose file + live `.env` live here).
- Containers: `api` (port 3000, behind Nginx), `postgres` (persistent volume),
  `redis` (internal only).
- Nginx on the host terminates TLS (DuckDNS + Let's Encrypt/Certbot) and
  reverse-proxies to the API. Port 3000 should stay closed in the EC2 security
  group — the API trusts the first proxy hop (`trust proxy` in `main.ts`) so
  `req.ip` is the real client for per-IP rate limiting.

### Environment (`~/skillshift/.env`)

Compose reads these variables from `.env` next to `docker-compose.yml`:

| Variable | Notes |
| --- | --- |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | strong secret; `15m` access tokens |
| `FRONTEND_URL`, `APP_URL` | public web-app origin — used for API CORS, the chat origin allowlist, and email links. Currently `https://skillshift-live.vercel.app`. |
| `AWS_REGION`, `AWS_S3_BUCKET` | S3 auth comes from the EC2 IAM role (`SkillShiftEC2Role`) — no keys in `.env` |
| `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Gmail SMTP + App Password (see "Mail" below) |

`DATABASE_URL` and `REDIS_URL` are provided by the Compose file (container
service names), not `.env`.

Apply any env change with:

```bash
docker compose up -d api   # recreates the container when its config changes
```

Logs:

```bash
docker compose logs -f --tail=100 api
```

### Database migrations

The production image intentionally excludes the Prisma CLI (it is a
devDependency), and migrations are **not** part of the CI deploy — apply them
deliberately:

```bash
# On the EC2 host, from the compose directory — publish Postgres on loopback:
cd ~/skillshift
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres

# From any checkout of this repo (on the host, or over an SSH tunnel):
cd backend
npm ci
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/skillshift" npx prisma migrate deploy
```

From a laptop, tunnel first: `ssh -L 5432:127.0.0.1:5432 <ec2-user>@<host>`,
then run the last command locally.

### Demo data (showcase dataset)

The deterministic demo dataset (see `docs/demo-data.md` for the local flow):

```bash
# On the EC2 host, with a checkout of this repo:
cd ~/skillshift
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d skillshift \
  < backend/prisma/demo-seed.sql
# (or pipe it over SSH from your machine)
```

The seed upserts fixed IDs and never touches `passwordHash`, so it is safe to
re-run. The demo admin credentials (`admin@skillshift.demo` / `Demo1234!`) are
published with the seed in this repository, so change the admin password once
after seeding a public deployment:

```bash
# 1) Generate a bcrypt hash (any machine with backend deps installed):
node -e 'require("bcrypt").hash("YOUR-NEW-PASSWORD", 12).then(console.log)'

# 2) Apply it on the EC2 host (quoted heredoc so `$` in the hash is not
#    expanded by the shell):
docker compose exec -T postgres psql -U postgres -d skillshift <<'SQL'
UPDATE "User" SET "passwordHash" = '<hash from step 1>'
WHERE email = 'admin@skillshift.demo';
SQL
```

Demo client/freelancer logins (`Demo1234!`) can stay public — they are the
"try it yourself" experience. The admin console must not be.

## Frontend (Vercel)

### First deploy

1. Vercel → **Add New → Project** → import this repository.
2. Set **Root Directory** to `frontend` (monorepo; build settings stay
   default: `next build`).
3. Add environment variables (Production + Preview) **before the first
   build** — `NEXT_PUBLIC_*` values are baked into the client bundle at build
   time:

| Variable | Value | Consumed by |
| --- | --- | --- |
| `SKILLSHIFT_API_URL` | `https://skillshift-api.duckdns.org` | server-side proxy (`/api/backend/*`) + server components (runtime env) |
| `NEXT_PUBLIC_API_URL` | `https://skillshift-api.duckdns.org` | chat socket in the browser (**build-time**) |
| `NEXT_PUBLIC_SITE_URL` | `https://skillshift-live.vercel.app` | metadata, sitemap, robots (**build-time**) |
| `NEXT_PUBLIC_S3_PUBLIC_BASE` | optional | public bucket/CDN base for uploaded images; without it the UI renders its designed fallbacks |

4. Deploy. The project name determines the resulting URL, which must be
   mirrored in the backend env and S3 CORS. If a build-time value changes
   later, redeploy for it to take effect.

### Wire the frontend URL into the backend

1. On EC2: set `FRONTEND_URL` and `APP_URL` in `~/skillshift/.env` to the
   deployed web-app origin, then `docker compose up -d api`. This drives API
   CORS, the chat-origin allowlist, and email links.
   - If the host's `docker-compose.yml` does not map them yet (the EC2 copy
     historically did not), add these under `api.environment` first:

     ```yaml
     FRONTEND_URL: ${FRONTEND_URL}
     APP_URL: ${APP_URL}
     ```

   - Verify: `docker compose exec -T api printenv FRONTEND_URL`
2. Add the web-app origin to the **S3 bucket CORS** (the browser uploads
   directly to S3 with a presigned PUT):

```json
[
  {
    "AllowedOrigins": ["https://skillshift-live.vercel.app"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. Refreshing sessions uses an HttpOnly cookie set through the frontend's
   same-origin proxy — `secure: true` requires HTTPS, which Vercel provides.
   If a custom domain replaces `skillshift-live.vercel.app`, update
   `FRONTEND_URL`, `APP_URL`, the S3 CORS origin, and `NEXT_PUBLIC_SITE_URL`
   (then redeploy the frontend).

## Mail (production)

Gmail SMTP via Nodemailer (queued with BullMQ on Redis): dedicated Gmail
account → 2FA → App Password (spaces stripped) in `SMTP_USER`/`SMTP_PASS`,
with `MAIL_FROM` matching the account. `MailService` refuses to boot with
`NODE_ENV=production` and no `SMTP_HOST`, or an `ethereal.email` host.

Smoke test: register on the live site and confirm the verification email
arrives; check `docker compose logs -f api` for queue errors.

`forgot-password` and `resend-verification` send mail to caller-supplied
addresses and are throttled per IP (5/hour and 10/hour) in `AuthService`,
on top of the per-account resend cooldown.

## Deploy checklist

- [ ] Push to `main` → CI green → backend image auto-deployed to EC2
- [ ] Vercel project created (root dir `frontend`) with all env vars set
      before the first build
- [ ] `FRONTEND_URL`/`APP_URL` on EC2 updated to the Vercel URL; `api`
      restarted
- [ ] S3 bucket CORS includes the Vercel origin
- [ ] Live registration delivers a Gmail verification email
- [ ] Live order cockpit shows the chat as connected (socket.io over HTTPS)
- [ ] Live avatar/service upload works (presigned PUT through bucket CORS)
- [ ] Demo seed applied; demo admin password changed
- [ ] Frontend URL recorded in this file and the README

## Known gotchas

- **Migrations**: not automated in CI — run `prisma migrate deploy` as above
  when the schema changes (the repo checkouts enable this; the prod image
  does not ship the Prisma CLI).
- **Single-origin CORS**: only `FRONTEND_URL` is allowed. Vercel *preview*
  deployments (random `*.vercel.app` subdomains) intentionally cannot call
  the production API.
- **`NEXT_PUBLIC_*` are build-time**: changing them in Vercel requires a
  redeploy; they will not take effect at runtime.
- **Port 3000** must remain closed to the internet on the EC2 security group
  so the `trust proxy` hop cannot be spoofed.
