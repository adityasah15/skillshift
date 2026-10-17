# SkillShift — Web App

The Next.js (App Router) frontend for [SkillShift](../README.md), the escrow-protected marketplace for freelance work. Product overview, architecture, and full-stack setup live in the root README and [`docs/`](../docs/).

## Run locally

```bash
npm install
```

Create `.env.local`:

```bash
SKILLSHIFT_API_URL=http://localhost:3000   # server-side proxy and server components
NEXT_PUBLIC_API_URL=http://localhost:3000  # chat socket in the browser
```

```bash
npm run dev -- -p 3001
```

The API owns port 3000; run the web app on 3001 to match the backend's `FRONTEND_URL` origin.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Client requests go through the same-origin proxy at `/api/backend/*`, which forwards to `SKILLSHIFT_API_URL` and keeps the refresh cookie first-party.
