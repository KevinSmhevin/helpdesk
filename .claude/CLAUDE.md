# Helpdesk

AI-powered ticket management system. Receives support emails, classifies them, auto-generates responses via Claude, and routes tickets to agents.

## Docs

Use Context7 MCP (`resolve-library-id` → `query-docs`) to fetch up-to-date documentation before working with any library. Do not rely on training data for library APIs.

## Stack

- **Runtime:** Bun
- **Backend:** Express + TypeScript (`/server`)
- **Frontend:** React + Vite + TypeScript + Tailwind v4 + React Router v6 + shadcn/ui (`/client`)
- **Data fetching:** axios + TanStack Query v5 (`@tanstack/react-query`)
- **Database:** PostgreSQL via Prisma
- **Auth:** Better Auth v1 (email/password, Prisma adapter)
- **Validation:** Zod — schemas defined in `@helpdesk/core`, used on server (`safeParse`) and client (`zodResolver`)
- **Forms:** React Hook Form + `@hookform/resolvers/zod` (`react-hook-form`) — client forms only
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Email:** SendGrid (inbound parse webhook)
- **Background jobs:** pg-boss

## Structure

```
helpdesk/
├── core/
│   └── src/
│       ├── enums/
│       │   ├── role.ts             # Role enum (admin | agent)
│       │   └── ticket.ts           # TicketStatus + TicketCategory enums
│       ├── schemas/
│       │   ├── user.ts             # Shared Zod schemas + inferred types
│       │   └── ticket.ts           # SendGridWebhookSchema + TicketCategoryLabels
│       └── index.ts                # Re-exports
├── e2e/
│   ├── tests/                      # Playwright test files go here
│   ├── playwright.config.ts        # Playwright config (loads .env.test, webServer)
│   ├── global-setup.ts             # Migrate + seed test DB before suite
│   └── global-teardown.ts          # Truncate test DB after suite
├── client/
│   └── src/
│       ├── lib/
│       │   ├── api.ts              # axios instance (withCredentials: true)
│       │   ├── auth-client.ts      # Better Auth React client singleton
│       │   └── utils.ts            # shadcn cn() utility
│       ├── test/
│       │   └── setup.ts            # Vitest setup — imports @testing-library/jest-dom
│       ├── components/
│       │   ├── ui/                 # shadcn components (button, input, label, card, table, …)
│       │   ├── Layout.tsx          # NavBar + <Outlet />
│       │   └── NavBar.tsx          # Nav links + sign out
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── HomePage.tsx
│       │   ├── TicketsPage.tsx     # All authenticated users: /tickets
│       │   └── UsersPage.tsx       # Admin-only: /users
│       └── App.tsx                 # Routes + ProtectedRoute + AdminRoute
└── server/
    ├── src/
    │   ├── lib/
    │   │   ├── auth.ts             # Better Auth config
    │   │   ├── middleware.ts       # requireAuth / requireAdmin Express middleware
    │   │   └── prisma.ts           # Prisma client singleton
    │   ├── routes/
    │   │   ├── tickets.ts          # GET /api/tickets (requireAuth)
    │   │   ├── users.ts            # User management routes (GET /api/users, POST, PUT, DELETE)
    │   │   └── webhooks.ts         # POST /api/webhooks/email — SendGrid inbound parse
    │   └── index.ts                # Express app entry point — mounts routers
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

# Unit / component tests (from client/)
bun run test          # run once
bun run test:watch    # watch mode

# E2E tests — see playwright-e2e-writer agent for full setup and run instructions
bun run test:e2e
```

## Environment

Copy `server/.env` from `server/.env.example`. Both `.env` and `.env.test` are gitignored. For E2E test environment setup see the playwright-e2e-writer agent.

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
| `SENDGRID_WEBHOOK_SECRET` | Token appended to the inbound parse URL as `?token=` (generate with `openssl rand -hex 32`) |
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

## Data Fetching

All client-side API calls use **axios** via the shared instance and **TanStack Query v5** for caching and state.

### axios instance

Import from `@/lib/api` — never use `fetch` directly for API calls:

```ts
import api from '@/lib/api'
```

The instance is pre-configured with `withCredentials: true` so session cookies are sent on every request.

### TanStack Query

`QueryClientProvider` is mounted in `main.tsx`. Use `useQuery` for reads and `useMutation` for writes:

```ts
// Read
const { data, isLoading, isError } = useQuery({
  queryKey: ['resource'],
  queryFn: () => api.get<Resource[]>('/api/resource').then((r) => r.data),
})

// Write — update cache directly on success instead of refetching
const mutation = useMutation({
  mutationFn: (body: Body) => api.post<Resource>('/api/resource', body).then((r) => r.data),
  onSuccess: (newItem) => {
    queryClient.setQueryData<Resource[]>(['resource'], (prev = []) => [newItem, ...prev])
  },
})
```

- Prefer `setQueryData` over `invalidateQueries` for mutations where the response includes the full updated record.
- Surface server error messages from `err.response.data.error` in `onError`.

## UI Components (shadcn/ui)

- **Installed:** shadcn/ui with the default theme (style: default, base color: zinc, CSS variables enabled). Currently installed components: `alert-dialog`, `button`, `card`, `dialog`, `input`, `label`, `skeleton`, `table`
- **Adding components:** `bunx shadcn@latest add <component>` from the `client/` directory
- **Import alias:** `@` resolves to `client/src/` — always use `@/components/ui/...` not relative paths
- **Theme tokens:** Use semantic CSS variables (`bg-muted`, `text-destructive`, `text-foreground`, etc.) rather than hardcoded Tailwind colors so the theme stays consistent
- **Tailwind v4:** Configured via `@tailwindcss/vite` plugin — no `tailwind.config.js` file; theme is defined in `src/index.css`
- **Tables:** Always use shadcn `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` from `@/components/ui/table` — never use native `<table>`, `<thead>`, `<tr>`, `<th>`, `<td>` elements directly

## Testing philosophy

**Default to unit/component tests. Use E2E only when a real browser, real server, or real database is essential to the assertion.**

The cost of an E2E test is roughly 10–50× a unit test: it needs two servers, a browser, a seeded database, and runs serially. Don't pay that cost for something a unit test can cover more reliably and faster.

### What belongs in unit/component tests

- All rendering logic: loading states, error states, empty states, conditional UI
- Data display: how a field is formatted, which label text appears, badges, dates
- Form behaviour: validation errors, submit flow, cache updates on success
- Access control within a component: buttons hidden/shown based on session role
- API call correctness: the right endpoint and payload were passed

If the assertion only requires rendering the component with mocked API responses, it's a unit test.

### What belongs in E2E tests

Only write an E2E test when the scenario **cannot be meaningfully verified without** a real browser, server, or database:

- **Auth and routing** — redirect to `/login` when unauthenticated, role-based route guards (`ProtectedRoute`, `AdminRoute`)
- **Full-stack data pipeline** — data created through one real system (e.g. webhook) actually appears in the browser via another real system (real DB → real API → real browser render)
- **Cross-system ordering/consistency** — e.g. `ORDER BY` on the real DB produces the correct row order in the UI
- **Nav and layout wiring** — links present in the real app shell, not a mocked component tree
- **Webhook and external integrations** — endpoints that accept multipart or non-JSON payloads from external services

Do **not** duplicate rendering-detail assertions in E2E that are already covered by unit tests (e.g. "the status badge says 'open'", "the em-dash shows for null category"). E2E tests for data should assert the subject/identifier appears — proving data flowed through — not re-verify how the component renders it.

## Unit / Component Testing

Client-side unit and component tests use **Vitest** + **React Testing Library**.

### Stack

- **Test runner:** Vitest (configured in `client/vite.config.ts`, jsdom environment, globals enabled)
- **Rendering:** `@testing-library/react`
- **User interactions:** `@testing-library/user-event`
- **Matchers:** `@testing-library/jest-dom` (imported in `client/src/test/setup.ts`)

### Test file location

Co-locate tests with their component: `src/pages/Foo.tsx` → `src/pages/Foo.test.tsx`.

### Conventions

**Mocking:**
- Mock `@/lib/api` and `@/lib/auth-client` with `vi.mock` at the top of each test file
- Always cast partial `useSession` mocks with `as unknown as ReturnType<typeof authClient.useSession>` to satisfy TypeScript
- Use `vi.fn()` for all mock implementations; call `vi.clearAllMocks()` in a top-level `beforeEach`

**Providers:**
- Wrap every render in a fresh `QueryClient` (with `retry: false`) + `QueryClientProvider` + `MemoryRouter`
- Pass `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to `MemoryRouter` to silence React Router v6 warnings

**Helpers:**
- Extract a `renderPage()` helper per file that wires up all providers and the session mock
- Extract shared mock setup (e.g. `mockGetUsers()`) and repeated interactions (e.g. `fillAndSubmitForm()`) into named helpers above the `describe` blocks
- Use per-`describe` `beforeEach` to set the GET mock when all tests in a group share the same response

**What to test:**
- Loading state (skeleton visible, data not yet rendered)
- Error state (error message shown on rejected query)
- Empty state (empty-list message)
- Happy path renders (correct data in the DOM)
- Mutations: success (cache updated, form cleared) and error (error message surfaced)
- Access control: buttons/elements hidden or shown based on session user

## E2E Testing

Use the **`playwright-e2e-writer` agent** to write Playwright tests. Do not write E2E tests yourself — always delegate to this agent.

**When to invoke it:**
- After adding auth/authorization behaviour (route guards, role checks)
- After building a feature whose correctness depends on a real server or database (e.g. data created via webhook appears in the UI)
- After wiring navigation or cross-page flows

**When NOT to invoke it:**
- For rendering details already covered by unit tests (loading states, field formatting, conditional UI)
- For API call correctness (use unit tests with mocked axios)

**How to invoke it:** describe the feature and explicitly state which concerns need E2E coverage vs. what is already covered by unit tests. Tests go in `e2e/tests/<feature>.spec.ts`.

## Best Practices

- **Env vars:** All secrets and environment-specific values live in `.env`. Use `.env.example` as the template — keep it up to date when adding new vars.
- **Database:** Always run `bunx prisma migrate dev` after editing `schema.prisma`. Never modify the database directly.
- **Prisma client:** Import the singleton from `server/src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere.
- **Auth client:** Import the singleton from `client/src/lib/auth-client.ts` — never call `createAuthClient()` more than once.
- **CORS:** `ALLOWED_ORIGINS` is the single source of truth. Both `cors()` middleware and Better Auth's `trustedOrigins` read from it.
- **Types:** Prefer TypeScript types inferred from Prisma and Better Auth (`typeof auth.$Infer.Session`) over hand-written interfaces.
- **API calls:** Always use the axios instance from `@/lib/api` — never call `fetch` directly for `/api/*` routes.
- **Server state:** Use TanStack Query (`useQuery` / `useMutation`) for all server state — no ad-hoc `useState` + `useEffect` fetch patterns.
- **Shared schemas:** Define Zod schemas in `core/src/schemas/<resource>.ts` and re-export from `core/src/index.ts`. Import as `@helpdesk/core` in both server and client. Never duplicate a schema — one source of truth for validation rules on both sides.
- **Request validation:** On the server, call `Schema.safeParse(req.body)` and return the first `issues[0].message` as `{ error: string }` with status 400 on failure. Schema fields should use custom messages so errors are user-friendly (e.g. `z.string().min(3, 'Name must be at least 3 characters')`).
- **Client forms:** Use React Hook Form with `zodResolver` from `@helpdesk/core` for all forms. Initialise with `useForm<SchemaInput>({ resolver: zodResolver(Schema), defaultValues: {...} })`. Wire inputs with `{...register('field')}` spread first, then add `id` and any other HTML attributes after — never override the `name` attribute that register sets (RHF uses `event.target.name` internally to dispatch changes). Display per-field errors from `formState.errors.<field>.message` beneath each input. Use `setError('root', { message })` + `formState.errors.root` for server-returned errors.
- **No hardcoded strings:** Never hardcode magic strings inline. Use Prisma-generated enums (e.g. `Role.agent` from `@prisma/client`) for enum values. Define error message strings as a `const` object at the top of the file (e.g. `const Errors = { EMAIL_TAKEN: '...' } as const`) and reference them by key.
- **Async route handlers:** Do not wrap async route handlers in try/catch — Express 5 automatically forwards thrown errors and rejected promises to the error handler. Keep handlers flat and let errors propagate.
- **Route modules:** Group related routes in `server/src/routes/<resource>.ts`, export a `Router`, and mount it in `index.ts` with `app.use('/api/<resource>', router)`. Apply shared middleware (e.g. `requireAdmin`) once via `router.use(...)` at the top of the module rather than repeating it on each handler.
