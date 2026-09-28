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
