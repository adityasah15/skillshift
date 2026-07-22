# SkillShift — Build Log

## Environment Setup (Pre-Phase 0)

**Stack:** NestJS + PostgreSQL + Redis + Prisma + Docker

**Machine:** Windows 11 + WSL 2 (Ubuntu)

### Why WSL?
Windows terminal (PowerShell/CMD) behaves differently from Linux
for shell commands, line endings, and Docker tooling. Since
production runs Linux, WSL eliminates environment mismatch locally.

### Tools installed
- Node.js v24.18.0 (inside WSL Ubuntu)
- Docker Desktop v29.6.1 (Windows, WSL 2 backend)
- NestJS CLI v11.0.24
- Git v2.55

### VSCode setup
- WSL extension installed
- Opened via `code .` from Ubuntu terminal
- Integrated terminal runs Ubuntu bash

### Key commands
```bash
# Open project in VSCode from WSL
code .

# Verify environment
node --version
docker --version
```

### Project created
```bash
cd ~/projects
nest new skillshift
cd skillshift
code .
```

---

## Phase 0 — Project Setup

*(in progress)*