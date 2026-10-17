# Engineering Decisions Log

The notable engineering decisions behind SkillShift, grouped by area. Each entry records the decision and why it was made, plus alternatives and trade-offs where they were meaningful.

## Development Environment

### Linux-based development environment

**Decision:** Use WSL 2 (Ubuntu) on Windows as the primary development environment.

**Why:**
- Production servers run Linux
- Docker Desktop uses WSL 2 as its backend anyway
- Avoids Windows-specific issues with line endings, path separators, and shell scripts

**Alternatives considered:**
- PowerShell — works for most tasks but causes friction with shell scripts and some npm packages
- Git Bash — lighter, but incomplete Linux emulation

**Trade-offs:** A small learning curve for WSL file-system paths.

### Databases in Docker, application on the host

**Decision:** PostgreSQL and Redis run in Docker containers during development; the NestJS application runs directly on the host with `npm run start:dev`.

**Why:**
- No local PostgreSQL or Redis installation or version management
- Containers are isolated and reproducible; `docker compose up` provides the database environment
- Direct process access keeps hot reload fast and debugging simple

**Alternatives considered:**
- Everything in Docker, including the API — slower development loop and hot-reload complexity
- Native PostgreSQL/Redis installs — version conflicts and harder resets

**Trade-offs:** Docker must be running, and ports 5432/6379 can conflict with other local services. The Dockerfile is a deployment artifact; the API is containerized in production, not during development.

## Architecture

### NestJS monolith over microservices

**Decision:** A single NestJS application with explicit domain-module boundaries, not microservices.

**Why:**
- Microservice overhead — service discovery, network calls, distributed tracing — is not justified at this scale
- A monolith is easier to develop, debug, and deploy
- Module boundaries leave room to split later if needed

**Alternatives considered:**
- Microservices — over-engineered at this scale
- Express — less structure, no dependency-injection container, more boilerplate

**Trade-offs:** Modules cannot be scaled independently, and the application is a single deployment unit.

## Orders, Disputes & Reviews

### Atomic dispute resolution

**Decision:** Dispute resolution updates the dispute, order, escrow, wallet, transaction, and audit records inside a single Prisma transaction.

**Why:** A resolution is one financial decision; partial completion could leave the system with inconsistent financial state.

### Conditional state updates for resolution

**Decision:** Dispute and escrow updates are conditional at the database level. A dispute can only be resolved while `OPEN` or `UNDER_REVIEW`; escrow can only be released or refunded while `HOLDING`.

**Why:** This prevents concurrent resolution requests and duplicate financial operations.

### Notifications after committed transactions

**Decision:** `DISPUTE_OPENED`, `DISPUTE_RESOLVED`, and `REVIEW_RECEIVED` notifications are queued only after the corresponding database transaction commits.

**Why:** Notifications describe committed state; queueing them earlier could announce operations that later roll back.

### Individual admin notification fan-out

**Decision:** `DISPUTE_OPENED` is delivered to every user with the `ADMIN` role as individual notification jobs.

**Why:** The notification model targets a single `userId`; a group-recipient abstraction was not warranted for this requirement.

### Existing audit log structure

**Decision:** No `disputeId` field was added to `AuditLog`; dispute events use the existing order/user-based audit structure.

**Why:** The current audit model records the relevant state transitions without expanding the schema.

### One review per order

**Decision:** `Review.orderId` keeps its `@unique` constraint: each order can be reviewed once.

**Why:** One review per order is the intended business rule, and the schema models it explicitly.

### Review direction: client → freelancer

**Decision:** Only the client reviews the freelancer. The reviewer and reviewee are derived from the authenticated user and the order.

**Why:** This matches the marketplace workflow and prevents clients from choosing reviewer or reviewee identities through the request body.

### Transactional review and profile update

**Decision:** Review creation and the freelancer profile's `rating` / `totalReviews` statistics are updated in one Prisma transaction.

**Why:** The review and the reputation numbers must stay consistent.

## Realtime Chat

### Reuse of existing infrastructure

**Decision:** The Chat module reuses the project's JWT authentication, Redis service, PostgreSQL persistence, and Notification/BullMQ infrastructure.

**Why:** Chat is a domain module inside the monolith and follows the established infrastructure boundaries; no parallel auth, cache, or notification system is needed.

### Order-participant authorization

**Decision:** Chat access is restricted to participants of the relevant order. Identity comes from the JWT, and participation is verified before a socket may join the order room or read message history.

**Why:** Authentication alone does not establish authorization to access a specific order conversation.

### Multi-socket presence counters

**Decision:** Presence is tracked with a counter rather than an online/offline flag.

**Why:** A user may have multiple simultaneous sockets; a boolean would mark the user offline when just one socket disconnects.

### Message rate limiting

**Decision:** A Redis counter limits each user to 30 messages per 60-second window; further messages are rejected with a WebSocket exception.

**Why:** Redis provides shared, short-lived state and is already part of the infrastructure.

### Cursor-based message history

**Decision:** Chat history uses cursor-based pagination.

**Why:** Message streams receive new records while users page through history; cursors avoid the shifting behavior of offset pagination.

### Notification separation

**Decision:** `MESSAGE_RECEIVED` notifications use the existing Notification/BullMQ system rather than a second realtime mechanism.

**Why:** Realtime delivery and asynchronous application notifications have different responsibilities, and the queue already provides the processing pipeline.

### Safe WebSocket lifecycle handling

**Decision:** Socket lifecycle handlers tolerate connections that never authenticated.

**Why:** A socket can disconnect before JWT authentication completes; the disconnect handler must not assume authenticated state exists.

## File Uploads

### Direct client-to-S3 uploads

**Decision:** File uploads use presigned S3 `PUT` URLs, so file bytes travel directly between the client and S3 rather than through the API server.

**Why:** Large payloads stay off the API process, while the backend still owns authentication, authorization, validation, URL generation, and confirmation.

### Upload confirmation via HeadObject

**Decision:** An upload is persisted in the database only after the backend confirms the object with S3 `HeadObject`.

**Why:** A presigned URL alone does not prove the upload succeeded; confirmation prevents records for missing objects.

### Resource-specific ownership

**Decision:** Upload authorization is evaluated per resource. Service and delivery uploads require ownership checks against the related records.

**Why:** Authentication identifies the user; the resource determines whether that user may modify the associated data.

### Delivery file persistence

**Decision:** Delivery uploads create `DeliveryFile` records linked to orders; service image uploads update `Service.imageUrls`.

**Why:** Delivery files and service images have different domain semantics and persistence requirements.

### DeliveryFile schema addition

**Decision:** The `DeliveryFile` model and the `Order.deliveryFiles` relation were added in migration `20260926140735_add_delivery_file`.

**Why:** Delivery files need structured metadata and an explicit relationship with the order.

## Deployment & Operations

### Docker Hub as the container registry

**Decision:** GitHub Actions publishes the production image to `adityasah15/skillshift-api` on Docker Hub, and EC2 pulls it.

**Why:** Image creation is separated from the runtime host, so deployments do not build on the server.

### GitHub Actions CI/CD

**Decision:** GitHub Actions runs the pipeline on every push and pull request: install dependencies, generate Prisma Client, lint, unit tests, integration tests, build the app, and build the Docker image. Pushes to `main` additionally publish the image and deploy it to EC2 over SSH.

**Why:** One automated, repeatable path from commit to running deployment.

### Single EC2 host with Docker Compose

**Decision:** The monolith runs on a single EC2 instance; Docker Compose manages PostgreSQL, Redis, and the API.

**Why:** This matches the application's architecture and provides a realistic production-style environment without infrastructure the scale does not require. PostgreSQL uses persistent storage so container replacement does not remove data.

### Nginx as reverse proxy

**Decision:** Nginx is the public HTTPS entry point, reverse-proxying to the API on port 3000.

**Why:** The application container stays behind a dedicated HTTP/TLS boundary.

### DuckDNS hostname

**Decision:** The API uses `skillshift-api.duckdns.org`.

**Why:** DuckDNS provides a free, stable hostname for this deployment; it is treated as a project hostname rather than a commercial domain.

### HTTPS with Let's Encrypt and Certbot

**Decision:** Let's Encrypt certificates are issued and renewed with Certbot for the Nginx host.

**Why:** HTTPS is required for secure cookies and browser uploads; renewal is automated.

### EC2 IAM role

**Decision:** The application uses the `SkillShiftEC2Role` instance profile instead of hard-coded AWS credentials.

**Why:** Credentials come from the EC2 environment, so no long-lived AWS keys live in application configuration.

### S3 least privilege

**Decision:** The instance role grants only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject`.

**Why:** Bucket enumeration permissions such as `s3:ListAllMyBuckets` are not needed by the application.

### Production Prisma migrations

**Decision:** Production migrations run with `prisma migrate deploy`, never `prisma migrate dev`.

**Why:** This separates development migration workflows from deliberate production deployment.

### Security boundary

**Decision:** PostgreSQL and Redis stay internal, port 3000 stays behind Nginx, production secrets stay out of Git, and AWS credentials come from IAM.

**Why:** Nginx over HTTPS remains the only public entry point.

### Non-goals

The deployment intentionally excludes Kubernetes, ECS/EKS, Terraform/IaC, multi-region infrastructure, load balancing, autoscaling, blue/green deployment, managed PostgreSQL/Redis, a CDN, a WAF, a commercial domain, and a production observability platform.
