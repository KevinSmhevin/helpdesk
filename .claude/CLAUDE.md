# Helpdesk

AI-powered ticket management system. Receives support emails, classifies them, auto-generates responses via Claude, and routes tickets to agents.

## Docs

Use Context7 MCP (`resolve-library-id` → `query-docs`) to fetch up-to-date documentation before working with any library. Do not rely on training data for library APIs.

## Stack

- **Runtime:** Bun
- **Backend:** Express + TypeScript (`/server`)
- **Frontend:** React + Vite + TypeScript + Tailwind v4 + React Router v6 + shadcn/ui (`/client`)
- **Database:** PostgreSQL via Prisma
- **Auth:** Better Auth v1 (email/password, Prisma adapter)
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Email:** SendGrid (inbound parse webhook)
- **Background jobs:** pg-boss

## Structure

```
helpdesk/
├── e2e/
│   ├── tests/                      # Playwright test files go here
│   ├── playwright.config.ts        # Playwright config (loads .env.test, webServer)
│   ├── global-setup.ts             # Migrate + seed test DB before suite
│   └── global-teardown.ts          # Truncate test DB after suite
├── client/
│   └── src/
│       ├── lib/
│       │   ├── auth-client.ts      # Better Auth React client singleton
│       │   └── utils.ts            # shadcn cn() utility
│       ├── components/
│       │   ├── ui/                 # shadcn components (button, input, label, card, …)
│       │   ├── Layout.tsx          # NavBar + <Outlet />
│       │   └── NavBar.tsx          # User name + sign out
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── HomePage.tsx
│       │   └── UsersPage.tsx       # Admin-only: /users
│       └── App.tsx                 # Routes + ProtectedRoute + AdminRoute
└── server/
    ├── src/
    │   ├── lib/
    │   │   ├── auth.ts             # Better Auth config
    │   │   ├── middleware.ts       # requireAuth / requireAdmin Express middleware
    │   │   └── prisma.ts           # Prisma client singleton
    │   └── index.ts                # Express app entry point
    └── prisma/
        ├── schema.prisma
        ├── seed.ts                 # Seeds admin user (prod/dev)
        ├── seed-test.ts            # Seeds admin + agent users (test DB only)
        └── teardown.ts             # Truncates all tables (used by global-teardown)
```

## Commands

```bash
# Install
bun install

# Dev
bun run dev:server   # Express on :3000
bun run dev:client   # Vite on :5173

# Database
cd server && bunx prisma migrate dev
cd server && bunx prisma generate
cd server && bunx prisma studio
cd server && bun prisma/seed.ts

# E2E tests (one-time setup)
createdb helpdesk_test               # create test DB
cd e2e && bunx playwright install    # install browsers

# E2E tests (run)
bun run test:e2e                     # from root
cd e2e && bun run test:ui            # interactive UI mode
```

## Environment

Copy `server/.env` from `server/.env.example` for development. For E2E tests, also create `server/.env.test` with the same keys pointing to the `helpdesk_test` database (port 3001, `ALLOWED_ORIGINS=http://localhost:5174`). Both files are gitignored.

Required vars:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Full URL of the Express server (e.g. `http://localhost:3000`) |
| `PORT` | Express port (default: `3000`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173,https://app.example.com`) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SEED_ADMIN_EMAIL` | Email for the seeded admin user |
| `SEED_ADMIN_PASSWORD` | Password for the seeded admin user |

Never hardcode secrets, URLs, or origins — always read from `process.env`.

## Auth

### How it works

- **Library:** Better Auth v1 (`better-auth`) with Prisma adapter
- **Strategy:** Email + password. Sign-up is **disabled** — users are created by admins only.
- **Sessions:** Database-backed (stored in the `Session` table via Prisma)
- **Roles:** `admin` | `agent` (stored on the `User` model, set server-side only)

### Server

All auth routes are handled by a single catch-all in `index.ts`:

```ts
app.all('/api/auth/*', toNodeHandler(auth))
```

Better Auth automatically exposes:
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET  /api/auth/session`

Config lives in `server/src/lib/auth.ts`. When adding auth features (plugins, extra fields), edit that file and run `bunx prisma migrate dev` if the schema changes.

CORS and `trustedOrigins` both read from `ALLOWED_ORIGINS` so they stay in sync — never configure them separately.

### Client

Use the singleton from `client/src/lib/auth-client.ts` everywhere:

```ts
import { authClient } from '@/lib/auth-client'

// Read session reactively
const { data: session, isPending } = authClient.useSession()

// Sign in
await authClient.signIn.email({ email, password }, { onSuccess, onError })

// Sign out
await authClient.signOut()
```

Never call `/api/auth/*` directly with `fetch` — always go through `authClient`.

### Protecting routes

Use the `ProtectedRoute` component in `App.tsx` to guard any route that requires authentication:

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route path="/new-page" element={<NewPage />} />
  </Route>
</Route>
```

`ProtectedRoute` redirects unauthenticated users to `/login` and handles the loading state. Do not duplicate this logic in individual pages.

For routes that require the `admin` role, use `AdminRoute` instead:

```tsx
<Route element={<AdminRoute />}>
  <Route element={<Layout />}>
    <Route path="/admin-only-page" element={<AdminOnlyPage />} />
  </Route>
</Route>
```

`AdminRoute` redirects unauthenticated users to `/login` and non-admins to `/`. It reads `session.user.role` from the Better Auth session.

## Dev Users

| Email | Password | Role |
|---|---|---|
| *(set via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)* | *(set via env)* | admin |
| `agent@example.com` | `password123` | agent |

## Domain

- **Ticket statuses:** open, resolved, closed
- **Ticket categories:** General Question, Technical Question, Refund Request
- **Roles:** admin (seeded on deploy), agent (created by admin)
- **AI responses:** auto-sent on ticket creation, no agent approval needed
- **Email:** inbound via SendGrid parse webhook; replies thread to existing tickets
- **Routing:** tickets auto-assigned to agent/team based on category

## UI Components (shadcn/ui)

- **Installed:** shadcn/ui with the default theme (style: default, base color: zinc, CSS variables enabled)
- **Adding components:** `bunx shadcn@latest add <component>` from the `client/` directory
- **Import alias:** `@` resolves to `client/src/` — always use `@/components/ui/...` not relative paths
- **Theme tokens:** Use semantic CSS variables (`bg-muted`, `text-destructive`, `text-foreground`, etc.) rather than hardcoded Tailwind colors so the theme stays consistent
- **Tailwind v4:** Configured via `@tailwindcss/vite` plugin — no `tailwind.config.js` file; theme is defined in `src/index.css`

## Best Practices

- **Env vars:** All secrets and environment-specific values live in `.env`. Use `.env.example` as the template — keep it up to date when adding new vars.
- **Database:** Always run `bunx prisma migrate dev` after editing `schema.prisma`. Never modify the database directly.
- **Prisma client:** Import the singleton from `server/src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere.
- **Auth client:** Import the singleton from `client/src/lib/auth-client.ts` — never call `createAuthClient()` more than once.
- **CORS:** `ALLOWED_ORIGINS` is the single source of truth. Both `cors()` middleware and Better Auth's `trustedOrigins` read from it.
- **Types:** Prefer TypeScript types inferred from Prisma and Better Auth (`typeof auth.$Infer.Session`) over hand-written interfaces.
