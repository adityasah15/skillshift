# Engineering Decisions Log

Format: Decision → Why → Alternatives considered → Trade-offs

---

## [D-001] WSL 2 as development environment on Windows

**Decision:** Use WSL 2 (Ubuntu) as the primary terminal, not PowerShell.

**Why:**
- Production servers run Linux
- Docker Desktop uses WSL 2 as its backend anyway
- Eliminates Windows-specific bugs (line endings, path separators,
  shell script compatibility)

**Alternatives considered:**
- PowerShell: Works for most things but causes friction with
  shell scripts and some npm packages
- Git Bash: Lighter but incomplete Linux emulation

**Trade-offs:**
- Small learning curve for WSL file system paths
- `code .` requires manual PATH setup in `.bashrc`

---

## [D-002] NestJS monolith over microservices

**Decision:** Single NestJS application, not microservices.

**Why:**
- Complexity of microservices (service discovery, network calls,
  distributed tracing) is not justified at this scale
- Monolith is easier to develop, debug, and deploy solo
- Can be split later if needed

**Alternatives considered:**
- Microservices: Over-engineered for a portfolio project
- Express: Less structure, no DI container, more boilerplate

**Trade-offs:**
- Scaling individual modules independently is harder
- Single point of failure

---

## [D-003] PostgreSQL + Redis in Docker, NestJS local

**Decision:** Run databases in Docker containers, NestJS directly on WSL.

**Why:**
- No need to install/manage PostgreSQL or Redis versions locally
- Containers are isolated and reproducible
- docker compose up = instant database environment
- NestJS runs locally for faster hot-reload during development

**Alternatives considered:**
- Everything in Docker including NestJS: Slower dev loop,
  hot-reload complexity
- Install PostgreSQL/Redis directly: Version conflicts,
  harder to reset/wipe

**Trade-offs:**
- Must have Docker Desktop running during development
- Port conflicts possible if something else uses 5432 or 6379





## [D-004] NestJS runs locally during development, not in Docker

**Decision:** Only PostgreSQL and Redis run in Docker during development.
NestJS runs directly on WSL with `npm run start:dev`.

**Why:**
- Faster hot reload (no volume mount overhead)
- Simpler debugging (direct process access)
- Dockerfile is a deployment artifact, not a development requirement
- Reduces cognitive load while learning NestJS architecture

**When does NestJS get containerized?**
Phase 13 (Deployment). The Dockerfile is written then, tested,
and used in the GitHub Actions CI/CD pipeline.

**Alternatives considered:**
- Containerize everything from Day 1: More reproducible but
  significantly slower dev loop and unnecessary complexity
  while the core features are still being built.

**Trade-off:**
- "Works on my machine" risk is slightly higher, but WSL
  standardizes the environment enough to mitigate this.