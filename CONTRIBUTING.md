# Contributing to SkillShift

Thanks for considering a contribution to SkillShift. Bug reports, feature suggestions, and pull requests are welcome. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Prerequisites

- Node.js 20+
- npm (the repository uses npm lockfiles for both packages)
- Docker (PostgreSQL and Redis run in containers)
- Git

## Set up locally

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/skillshift.git
   cd skillshift
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL and Redis:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
   ```

4. Start the API — `http://localhost:3000`, Swagger at `/api/docs`:

   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma generate
   npm run start:dev
   ```

5. Start the web app in a second terminal — `http://localhost:3001`:

   ```bash
   cd frontend
   npm install
   ```

   Create `frontend/.env.local`:

   ```bash
   SKILLSHIFT_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

   ```bash
   npm run dev -- -p 3001
   ```

The web app must run on port 3001 to match the backend's `FRONTEND_URL` origin. The README covers environment variables, demo data, and deployment in more detail.

## Reporting bugs

1. Check the existing [issues](https://github.com/adityasah15/skillshift/issues) first.
2. Open an issue with a clear title and enough detail to reproduce:
   - steps to reproduce
   - expected vs. actual behaviour
   - Node/npm versions and OS details

## Suggesting enhancements

Open an issue describing the problem or use case and the behaviour you would like to see. Explain why it belongs in SkillShift before proposing an implementation.

## Pull requests

1. Branch from `main`:

   ```bash
   git checkout -b feature/your-feature
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Make the change, keeping it focused on one concern.
3. Run the relevant checks.

   **Backend**

   ```bash
   cd backend
   npm run lint
   npm run test
   npm run test:e2e   # requires PostgreSQL and Redis
   ```

   **Frontend**

   ```bash
   cd frontend
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

4. Commit with a conventional message:

   ```text
   feat: add service availability filter
   fix: keep escrow state on cancelled orders
   docs: clarify upload limits
   ```

5. Push your branch and open a pull request against `main`. Describe what changed, why, and reference related issues (for example `Closes #12`).

## Coding standards

- TypeScript strictness: prefer explicit types; avoid `any`.
- Follow the ESLint configuration in each package.
- Keep controllers thin and put business rules in services.
- Never introduce an order or escrow status transition outside the service layer.
- Add tests for behaviour changes in the backend.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).
