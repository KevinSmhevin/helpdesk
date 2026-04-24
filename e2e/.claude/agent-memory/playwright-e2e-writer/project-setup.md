---
name: Project setup
description: e2e package layout, playwright config details, base URL, test env, and global setup/teardown
type: project
---

- Tests live in `e2e/tests/` (testDir: './tests'). The package is `@helpdesk/e2e` at `e2e/`.
- `playwright.config.ts` loads env from `server/.env.test` via dotenv.
- baseURL is `http://localhost:5174` (Vite runs on 5174 for tests, not the default 5173).
- The Express test server runs on port 3001 (not 3000); health check at `http://localhost:3001/api/health`.
- `VITE_API_URL=http://localhost:3001` is injected into the Vite dev server for e2e runs.
- `globalSetup` runs `bunx prisma migrate deploy` then `bun prisma/seed-test.ts` — seeds admin + agent users.
- `globalTeardown` runs `bun prisma/teardown.ts` — truncates all auth tables.
- Seeded test users: `admin@example.com / password123` (admin), `agent@example.com / password123` (agent).
- Run tests: `bun run --filter @helpdesk/e2e test` (from repo root) or `playwright test` from `e2e/`.
- `fullyParallel: true`; CI uses 1 worker and 2 retries.
