### Phase 13 — Docker + CI/CD + Deployment

**Status:** Complete — implemented, deployed, and verified.

Implemented and verified:

* Multi-stage production Dockerfile
* Production `docker-compose.yml`
* `.env.example`
* PostgreSQL 16 container with persistent volume
* Redis 7 container
* NestJS API container
* Docker Hub image publishing
* AWS EC2 deployment
* Nginx reverse proxy
* DuckDNS project hostname
* Let's Encrypt SSL via Certbot
* Automatic SSL renewal configuration and dry-run verification
* S3 integration through EC2 IAM role
* Bucket/object-scoped S3 permissions
* GitHub Actions CI pipeline
* Automated Docker image publishing
* Automated EC2 deployment after successful CI
* Production Prisma migrations

### CI/CD

GitHub Actions performs:

```text
npm ci
→ Prisma generate
→ ESLint
→ Jest
→ NestJS build
→ Docker build
→ Docker Hub push
→ SSH deployment to EC2
```

The complete pipeline was successfully rerun after correcting EC2 SSH access.

### Production Architecture

```text
Client
  ↓
DuckDNS
  ↓
Nginx :443
  ↓
NestJS API :3000
  ├── PostgreSQL
  ├── Redis
  └── S3
```

### Live Deployment

API:

```text
https://skillshift-api.duckdns.org
```

Swagger:

```text
https://skillshift-api.duckdns.org/api/docs
```

Both were successfully verified over HTTPS.

### Security

* Production `.env` is not committed.
* EC2 uses an IAM instance profile rather than hard-coded AWS credentials.
* S3 permissions are restricted to required object operations.
* PostgreSQL and Redis remain internal to the deployment.
* Nginx is the public entry point.
* SSH private keys and other secrets must remain untracked.

### Verification

Verified:

* Docker containers running
* Prisma production migrations deployed
* Nginx configuration
* HTTP reverse proxy
* HTTPS
* Certbot renewal simulation
* S3 IAM role
* S3 permission boundaries
* GitHub Actions CI
* Docker Hub publishing
* Automatic EC2 deployment
* Live API
* Live Swagger

### Post-Phase 13 Fixes

#### Search Cursor Pagination

**Status:** Implemented + tested.

The Search module cursor pagination was corrected to mirror its existing ordering:

```text
ORDER BY "createdAt" DESC, "id" DESC
```

The cursor now contains both `createdAt` and `id`, with the next-page condition:

```text
"createdAt" < cursor.createdAt
OR (
  "createdAt" = cursor.createdAt
  AND "id" < cursor.id
)
```

This makes pagination deterministic when multiple services share the same `createdAt` value.

Verified with:

* first-page retrieval
* composite cursor generation
* subsequent-page retrieval
* multiple consecutive pages
* duplicate prevention
* invalid cursor handling

Final verification:

* 32 test suites passed
* 140 tests passed
* `npm run build` passed
* `npm run lint` passed with 0 errors
* GitHub Actions passed

#### EC2 SSH Access

**Status:** Operational issue resolved.

Local EC2 SSH access was restored after identifying that the local deployment PEM public key was missing from the EC2 user's `authorized_keys`.

The matching public key was added, SSH permissions were corrected, and connection was successfully verified using the local PEM.

The GitHub Actions deployment SSH key remains configured separately.

Private PEM files remain excluded through `.gitignore` and must not be committed.

### Next

**Phase 14 — Documentation & Final Polish**

Planned areas:

* README
* Architecture documentation
* ER/database documentation
* API documentation
* Setup instructions
* Deployment documentation
* Security documentation
* Postman collection
* Final testing
* Project cleanup
* Final checkpoint

No new architectural features should be introduced unless required by the Blueprint.

### Repository Structure Update

**Status:** Implemented + verified.

The NestJS backend was moved into a dedicated `backend/` directory.

Backend-owned files now reside under `backend/`, including:

* NestJS source
* Prisma schema and migrations
* tests
* configuration
* Dockerfile
* `package.json` / `package-lock.json`

Deployment and CI configuration was updated accordingly:

* Docker Compose builds from `./backend`.
* GitHub Actions runs Node/npm/Prisma/lint/tests/build from `backend/`.
* Docker build/push uses `./backend` as the build context.
* `.gitignore` excludes backend-generated files:

  * `backend/dist/`
  * `backend/node_modules/`
  * `backend/generated/`

### Verification

* `npm ci` passed.
* `npx prisma generate` passed.
* `npm run lint` passed with 0 errors and 7 existing warnings.
* `npm test -- --runInBand` passed: **32 suites / 140 tests**.
* `npm run build` passed.
* `docker build -t skillshift-api ./backend` passed.
* `docker compose config` passed.
* Git rename detection confirmed the backend files were moved without content changes.

**Commit:** `3311d7a` — `chore: move backend into dedicated directory`

### Architectural Impact

No application architecture changed.

SkillShift remains a NestJS monolith. The change only reorganized the repository and updated deployment/CI paths to match the new structure.

### Deferred

Documentation paths and references affected by the new `backend/` structure are being updated separately.

