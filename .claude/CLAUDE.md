# Helpdesk

AI-powered ticket management system. Receives support emails, classifies them, auto-generates responses via Claude, and routes tickets to agents.

## Docs

Use Context7 MCP (`resolve-library-id` → `query-docs`) to fetch up-to-date documentation before working with any library. Do not rely on training data for library APIs.

## Stack

- **Runtime:** Bun (workspaces — `client`, `core`, `server`, `e2e`)
- **Backend:** Express 5 + TypeScript (`/server`) — `helmet`, `cors`, `express-rate-limit`, `multer` (multipart for SendGrid)
- **Frontend:** React + Vite + TypeScript + Tailwind v4 + React Router v6 + shadcn/ui (`/client`)
- **Tables:** `@tanstack/react-table` v8 (sorting/columns)
- **Icons:** `lucide-react`
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
├── core/                              # @helpdesk/core — shared between client and server
│   └── src/
│       ├── enums/
│       │   ├── role.ts                # Role { admin, agent }
│       │   ├── sender.ts              # SenderType { agent, customer }
│       │   ├── sort.ts                # SortOrder { asc, desc }
│       │   └── ticket.ts              # TicketStatus, TicketCategory, TicketSortColumn
│       ├── schemas/
│       │   ├── user.ts                # CreateUserSchema, UpdateUserSchema
│       │   └── ticket.ts              # SendGridWebhookSchema, UpdateTicketSchema,
│       │                              # CreateReplySchema, TicketCategoryLabels,
│       │                              # Ticket + Agent types (single source of truth)
│       └── index.ts                   # Barrel re-exports
├── e2e/
│   ├── tests/
│   │   ├── auth.spec.ts
│   │   ├── tickets.spec.ts
│   │   ├── ticket-detail.spec.ts
│   │   ├── users.spec.ts
│   │   ├── webhook.spec.ts
│   │   ├── fixtures/auth.ts           # loginAsAdmin / loginAsAgent fixtures
│   │   └── helpers.ts                 # expectLoginPage / expectDashboardPage
│   ├── playwright.config.ts           # Loads server/.env.test, webServer block
│   ├── global-setup.ts                # Migrate + seed test DB
│   └── global-teardown.ts             # Truncate test DB
├── client/
│   └── src/
│       ├── lib/
│       │   ├── api.ts                 # axios instance (withCredentials: true)
│       │   ├── auth-client.ts         # Better Auth React client singleton
│       │   ├── ticket.ts              # statusStyles map (shared between table + badges)
│       │   └── utils.ts               # shadcn cn() utility
│       ├── test/setup.ts              # Vitest setup — imports @testing-library/jest-dom
│       ├── components/
│       │   ├── ui/                    # shadcn: alert-dialog, button, card, dialog,
│       │   │                          #         input, label, select, skeleton, table
│       │   ├── Layout.tsx             # NavBar + <Outlet />
│       │   └── NavBar.tsx             # Nav links (Users link admin-only) + sign out
│       ├── pages/                     # One folder per page; co-located components + index.ts
│       │   ├── LoginPage/             # LoginPage, LoginForm, LoginSkeleton
│       │   ├── HomePage/              # HomePage, ServerStatus, ServerStatusSkeleton
│       │   ├── TicketsPage/           # TicketsPage, TicketsFilters, TicketsTable,
│       │   │                          # TicketsPagination, TicketsTableSkeleton
│       │   ├── TicketDetailPage/      # TicketDetailPage, BackToTickets, TicketMetaPanel,
│       │   │                          # TicketMessagePanel, TicketReplyThread,
│       │   │                          # TicketDetailSkeleton
│       │   └── UsersPage/             # UsersPage, AddAgentForm, UsersTable,
│       │                              # EditUserDialog, UsersTableSkeleton
│       └── App.tsx                    # Routes + ProtectedRoute + AdminRoute
└── server/
    ├── src/
    │   ├── lib/
    │   │   ├── auth.ts                # Better Auth config (Role additionalField, sessions)
    │   │   ├── middleware.ts          # requireAuth / requireAdmin (sets res.locals.session)
    │   │   └── prisma.ts              # Prisma client singleton
    │   ├── routes/
    │   │   ├── tickets.ts             # GET/PATCH /api/tickets[/:id], replies subresource
    │   │   ├── users.ts               # Admin-only user CRUD (soft delete)
    │   │   ├── agents.ts              # GET /api/agents — active agents for assignment dropdowns
    │   │   └── webhooks.ts            # POST /api/webhooks/email — SendGrid inbound parse
    │   └── index.ts                   # App entry — helmet, cors, rate-limit, error handler
    └── prisma/
        ├── schema.prisma              # User, Session, Account, Verification, Ticket, Reply
        ├── seed.ts                    # Seeds admin (prod/dev)
        ├── seed-test.ts               # Seeds admin + agent (test DB only)
        ├── seed-tickets.ts            # Seeds ~100 demo tickets with varied dates/categories
        └── teardown.ts                # Truncates all tables
```

## Page structure convention

Each page lives in its own folder (`pages/<PageName>/`) with:
- A main page component (`<PageName>.tsx`) that owns the data fetch and composes children
- One file per child component (filters, table, pagination, skeleton, dialog, etc.)
- A `<PageName>.test.tsx` co-located with the page (tests cover children through the page)
- An `index.ts` that re-exports the default

Children should be presentation-focused. Mutations live in the child that owns the action (e.g. `EditUserDialog` owns the PUT call), not bubbled up. Skeletons are siblings, not props.

## Commands

```bash
# Install
bun install

# Dev (run together)
bun run dev          # client + server in parallel
bun run dev:server   # Express on :3000
bun run dev:client   # Vite on :5173

# Database
cd server && bunx prisma migrate dev
cd server && bunx prisma generate
cd server && bunx prisma studio
cd server && bun prisma/seed.ts          # admin only
cd server && bun prisma/seed-tickets.ts  # ~100 demo tickets

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
| `BETTER_AUTH_SECRET` | Secret key for Better Auth (generate with `openssl rand -base64 32`) — server refuses to start if unset or `change-me` |
| `BETTER_AUTH_URL` | Full URL of the Express server (e.g. `http://localhost:3000`) |
| `PORT` | Express port (default: `3000`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173,https://app.example.com`) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_WEBHOOK_SECRET` | Token appended to the inbound parse URL as `?token=` (generate with `openssl rand -hex 32`) — server refuses to start if unset |
| `SEED_ADMIN_EMAIL` | Email for the seeded admin user |
| `SEED_ADMIN_PASSWORD` | Password for the seeded admin user |

Never hardcode secrets, URLs, or origins — always read from `process.env`.

## Auth

### How it works

- **Library:** Better Auth v1 (`better-auth`) with Prisma adapter
- **Strategy:** Email + password. Sign-up is **disabled** — users are created by admins only
- **Sessions:** Database-backed (stored in the `Session` table via Prisma), 7-day expiry, 1-day rolling update, 5-min cookie cache
- **Roles:** `admin` | `agent` — added via Better Auth `user.additionalFields` with `input: false` so clients can never set it. `Role.agent` is the default
- **Cookies:** `useSecureCookies` enabled when `NODE_ENV === 'production'`

### Server

All auth routes are handled by a single catch-all in `index.ts`:

```ts
app.all('/api/auth/*', toNodeHandler(auth))
```

A rate limiter is mounted in front of `/api/auth/sign-in` (20 requests / 15 min, skipped when `NODE_ENV === 'test'`).

Better Auth automatically exposes:
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET  /api/auth/session`

Config lives in `server/src/lib/auth.ts`. When adding auth features (plugins, extra fields), edit that file and run `bunx prisma migrate dev` if the schema changes.

CORS and `trustedOrigins` both read from `ALLOWED_ORIGINS` so they stay in sync — never configure them separately.

### Middleware

`server/src/lib/middleware.ts` exports two middlewares:

- `requireAuth` — 401 if no session; on success sets `res.locals.session = session` and calls `next()`
- `requireAdmin` — 401 if unauthenticated, 403 if `session.user.role !== Role.admin`; sets `res.locals.session`

Apply them once per router via `router.use(...)`, not on each handler. Read the session from handlers as `res.locals.session` (typed as `{ user: { id: string; role?: Role } }`).

### Client

Use the singleton from `client/src/lib/auth-client.ts` everywhere:

```ts
import { authClient } from '@/lib/auth-client'

const { data: session, isPending } = authClient.useSession()
await authClient.signIn.email({ email, password }, { onSuccess, onError })
await authClient.signOut()
```

Never call `/api/auth/*` directly with `fetch` — always go through `authClient`.

### Protecting routes

Use `ProtectedRoute` (any session) or `AdminRoute` (admin only) in `App.tsx`:

```tsx
<Route element={<ProtectedRoute />}>
  <Route element={<Layout />}>
    <Route path="/tickets" element={<TicketsPage />} />
    <Route path="/tickets/:id" element={<TicketDetailPage />} />
  </Route>
</Route>

<Route element={<AdminRoute />}>
  <Route element={<Layout />}>
    <Route path="/users" element={<UsersPage />} />
  </Route>
</Route>
```

`ProtectedRoute` redirects unauthenticated users to `/login`; `AdminRoute` additionally redirects non-admins to `/`. Both render a full-page skeleton while the session is loading. Do not duplicate this logic in pages.

## Dev Users

| Email | Password | Role |
|---|---|---|
| *(set via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`)* | *(set via env)* | admin |
| `agent@example.com` | `password123` | agent (test DB only — created by `seed-test.ts`) |

## Domain

### Tickets

- **Statuses:** open, resolved, closed
- **Categories:** General Question, Technical Question, Refund Request — nullable (a ticket can have no category)
- **Inbound:** SendGrid parse webhook (`POST /api/webhooks/email?token=…`). The webhook parses `From`, `To`, `Subject`, `Message-ID`, and `In-Reply-To` from the multipart body. Tickets are deduplicated by `messageId` (returns 200 with `{ ok: true }` on duplicate so SendGrid does not retry). Express 5's error handler also collapses Prisma `P2002` unique-constraint violations to a 200 fallback
- **Assignment:** tickets have an optional `assignedToId` referencing a `User`. Reassignment is done via `PATCH /api/tickets/:id`
- **Replies:** threaded via the `Reply` model with `senderType` of `agent` (linked to a User) or `customer` (no User). Agent replies authored through the UI write `senderType: 'agent'` and `userId: <session.user.id>`

### Users

- **Roles:** admin (seeded on deploy), agent (created by admins via the UI)
- **Soft delete:** `User.deletedAt` is a nullable timestamp. Queries that should ignore deleted users must filter `where: { deletedAt: null }`. Deletes are issued as `prisma.user.update({ data: { deletedAt: new Date() } })` followed by `prisma.session.deleteMany({ where: { userId } })` so the deactivated user is signed out everywhere
- **Constraints enforced server-side:** admins cannot delete themselves; admins cannot be deleted via the API. Email-already-taken returns 409

### AI / email

- **AI responses:** auto-sent on ticket creation, no agent approval needed
- **Email replies:** thread to existing tickets via `In-Reply-To` header
- **Routing:** tickets auto-assigned to agent/team based on category

## API Endpoints

All routes live in `server/src/routes/<resource>.ts` and are mounted in `server/src/index.ts` with `app.use('/api/<resource>', router)`. Apply shared middleware (`requireAuth`, `requireAdmin`) once via `router.use(...)` at the top of the module.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/health` | public | `{ status: 'ok' }` |
| `*` | `/api/auth/*` | public | Better Auth catch-all (sign-in rate-limited) |
| `POST` | `/api/webhooks/email` | `?token=` | Multipart (SendGrid). Dedupes on `Message-ID` |
| `GET` | `/api/tickets` | auth | Query params: `sortBy`, `sortOrder`, `status`, `category`, `search`, `page`. Page size 10. Returns `{ tickets, total, page, pageSize, totalPages }` |
| `GET` | `/api/tickets/:id` | auth | Includes `assignedTo` |
| `PATCH` | `/api/tickets/:id` | auth | Body validated by `UpdateTicketSchema` (`assignedToId?`, `status?`, `category?`) |
| `GET` | `/api/tickets/:id/replies` | auth | Returns replies sorted `createdAt asc`, each with `user` |
| `POST` | `/api/tickets/:id/replies` | auth | Body validated by `CreateReplySchema` (`body`). Server forces `senderType: agent` and `userId: session.user.id` |
| `GET` | `/api/agents` | auth | Active agents only (`deletedAt: null`, `role: agent`), used by assignment dropdowns |
| `GET` | `/api/users` | admin | Active users (`deletedAt: null`) |
| `POST` | `/api/users` | admin | `CreateUserSchema`. Hashes password with Better Auth `hashPassword`, creates `Account` row with `providerId: 'credential'` |
| `PUT` | `/api/users/:id` | admin | `UpdateUserSchema`. Empty `password` keeps the existing one |
| `DELETE` | `/api/users/:id` | admin | Soft delete. Refuses self-delete (400) and admin-delete (403) |

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

- Prefer `setQueryData` over `invalidateQueries` for mutations where the response includes the full updated record
- Surface server error messages from `err.response.data.error` in `onError`
- For paginated lists pass `placeholderData: keepPreviousData` so the previous page stays visible during the next fetch — see `TicketsPage`
- Debounced inputs (search, etc.) belong in component state and feed into the query key after a `setTimeout(…, 300)` — see `TicketsPage`. The page also resets to page 1 whenever filters/sort/search change

### Shared types

Shared API types live in `core/src/schemas/<resource>.ts` and are exported from `core/src/index.ts`. Both client and server import them as `@helpdesk/core`. The current shared types are `Ticket` and `Agent` — they are the single source of truth and must not be redefined per page or pick-narrowed. List endpoints return a subset of `Ticket` fields; that's fine — components access only the fields they need.

## UI Components (shadcn/ui)

- **Installed:** `alert-dialog`, `button`, `card`, `dialog`, `input`, `label`, `select`, `skeleton`, `table`. Style: default, base color: zinc, CSS variables enabled
- **Adding components:** `bunx shadcn@latest add <component>` from `client/`
- **Import alias:** `@` resolves to `client/src/` — always use `@/components/ui/...` (no relative paths)
- **Theme tokens:** Use semantic CSS variables (`bg-muted`, `text-destructive`, `text-foreground`, `border-border`, etc.) instead of hardcoded Tailwind colors so the theme stays consistent
- **Tailwind v4:** Configured via `@tailwindcss/vite` plugin — no `tailwind.config.js`; theme is defined in `src/index.css`
- **Tables:** Always use shadcn `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` from `@/components/ui/table` — never use native `<table>`, `<thead>`, `<tr>`, `<th>`, `<td>`
- **Sortable tables:** Use `@tanstack/react-table` (`useReactTable`, `createColumnHelper`, `flexRender`) with `manualSorting: true` so the server does the sort — see `TicketsTable`
- **Confirmation dialogs:** Destructive actions (delete) use `AlertDialog` with `AlertDialogAction` styled `bg-destructive text-destructive-foreground` — see `UsersTable`
- **Forms-in-dialogs:** Use `Dialog` controlled by an `open={resource !== null}` pattern; reset the form via `useEffect` watching the resource — see `EditUserDialog`
- **Status / role styles:** Reusable colour maps belong in `@/lib/<resource>.ts` (e.g. `statusStyles` in `@/lib/ticket.ts`) so the table cell and any badges stay in sync

## Testing philosophy

**Default to unit/component tests. Use E2E only when a real browser, real server, or real database is essential to the assertion.**

The cost of an E2E test is roughly 10–50× a unit test: it needs two servers, a browser, a seeded database, and runs serially. Don't pay that cost for something a unit test can cover more reliably and faster.

### What belongs in unit/component tests

- All rendering logic: loading states, error states, empty states, conditional UI
- Data display: how a field is formatted, which label text appears, badges, dates
- Form behaviour: validation errors, submit flow, cache updates on success
- Access control within a component: buttons hidden/shown based on session role
- API call correctness: the right endpoint and payload were passed
- Select / dropdown interactions (PATCH calls, error states) using the Select mock below

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

Co-locate tests with their component: `src/pages/Foo/Foo.tsx` → `src/pages/Foo/Foo.test.tsx`. Test the page through its top-level component — child components (filters, tables, panels, dialogs) are exercised via the page render. Only co-locate a separate `Child.test.tsx` if the child has standalone logic that the page test cannot reach.

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

**Mocking shadcn `Select`:**

The base-ui `Select` doesn't open its popup in jsdom, so any test that needs to click a `SelectItem` must replace the module with a minimal context-driven implementation. Copy this block verbatim — it's load-bearing for `TicketDetailPage.test.tsx` and any new test that exercises the meta-panel selects:

```ts
vi.mock('@/components/ui/select', async () => {
  const React = await import('react')
  type OnChange = (v: string) => void
  const Ctx = React.createContext<OnChange | undefined>(undefined)
  return {
    Select: ({ onValueChange, disabled, children }) =>
      React.createElement(Ctx.Provider, { value: onValueChange },
        React.createElement('div', { 'aria-disabled': disabled ?? false }, children)),
    SelectTrigger: ({ children, className }) =>
      React.createElement('button', { role: 'combobox', type: 'button', className }, children),
    SelectValue: () => null,
    SelectContent: ({ children }) => React.createElement('div', null, children),
    SelectItem: ({ value, children }) => {
      const onChange = React.useContext(Ctx)
      return React.createElement('button', { role: 'option', type: 'button', onClick: () => onChange?.(value) }, children)
    },
  }
})
```

To target a specific field's combobox or option, scope queries to the field label:

```ts
function fieldCombobox(label: string) {
  return within(screen.getByText(label).closest('div')!).getByRole('combobox')
}
function fieldOption(label: string, optionName: string) {
  return within(screen.getByText(label).closest('div')!).getByRole('option', { name: optionName })
}
```

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

Existing E2E coverage:
- `auth.spec.ts` — login, error states, session persistence, sign-out, `ProtectedRoute`, `AdminRoute`
- `tickets.spec.ts` — empty state, route guards, nav link visibility, webhook → table pipeline, ordering
- `ticket-detail.spec.ts` — route guard, list → detail navigation, back link, reply form full-stack pipeline
- `users.spec.ts`, `webhook.spec.ts` — admin user management and SendGrid webhook acceptance

E2E specs that share DB state should declare `test.describe.configure({ mode: 'serial' })` at the file level. Seed tickets via the webhook (`POST ${SERVER}/api/webhooks/email?token=…` with multipart) using a unique `Message-ID` per call.

## Best Practices

- **Env vars:** All secrets and environment-specific values live in `.env`. Use `.env.example` as the template — keep it up to date when adding new vars
- **Database:** Always run `bunx prisma migrate dev` after editing `schema.prisma`. Never modify the database directly
- **Prisma client:** Import the singleton from `server/src/lib/prisma.ts` — never instantiate `PrismaClient` elsewhere
- **Auth client:** Import the singleton from `client/src/lib/auth-client.ts` — never call `createAuthClient()` more than once
- **CORS:** `ALLOWED_ORIGINS` is the single source of truth. Both `cors()` middleware and Better Auth's `trustedOrigins` read from it
- **Types:** Prefer TypeScript types inferred from Prisma and Better Auth (`typeof auth.$Infer.Session`) over hand-written interfaces
- **API calls:** Always use the axios instance from `@/lib/api` — never call `fetch` directly for `/api/*` routes
- **Server state:** Use TanStack Query (`useQuery` / `useMutation`) for all server state — no ad-hoc `useState` + `useEffect` fetch patterns
- **Shared schemas + types:** Define Zod schemas and shared response types in `core/src/schemas/<resource>.ts` and re-export from `core/src/index.ts`. Import as `@helpdesk/core` in both server and client. Never duplicate a schema or a response shape (e.g. `Ticket`, `Agent`) per page — one source of truth on both sides. Do not create page-local picks of a shared type; use the shared type directly even if the list endpoint omits some fields
- **Request validation:** On the server, call `Schema.safeParse(req.body)` and return the first `issues[0].message` as `{ error: string }` with status 400 on failure. Schema fields should use custom messages so errors are user-friendly (e.g. `z.string().min(3, 'Name must be at least 3 characters')`)
- **Client forms:** Use React Hook Form with `zodResolver` from `@helpdesk/core` for all forms. Initialise with `useForm<SchemaInput>({ resolver: zodResolver(Schema), defaultValues: {...} })`. Wire inputs with `{...register('field')}` spread first, then add `id` and any other HTML attributes after — never override the `name` attribute that register sets (RHF uses `event.target.name` internally to dispatch changes). Display per-field errors from `formState.errors.<field>.message` beneath each input. Use `setError('root', { message })` + `formState.errors.root` for server-returned errors
- **No hardcoded strings:** Never hardcode magic strings inline. Use Prisma-generated enums (e.g. `Role.agent` from `@prisma/client`) for enum values. Define error message strings as a `const` object at the top of the file (e.g. `const Errors = { EMAIL_TAKEN: '...' } as const`) and reference them by key
- **Soft delete:** Users use `deletedAt` for soft delete. Every query against the `User` table that should ignore deactivated accounts must filter `where: { deletedAt: null }`. Always cascade by deleting the user's sessions (`prisma.session.deleteMany`) so they are signed out everywhere. Refuse self-delete and admin-delete on the server, never just on the client
- **Async route handlers:** Do not wrap async route handlers in try/catch — Express 5 automatically forwards thrown errors and rejected promises to the error handler. Keep handlers flat and let errors propagate
- **Route modules:** Group related routes in `server/src/routes/<resource>.ts`, export a `Router`, and mount it in `index.ts` with `app.use('/api/<resource>', router)`. Apply shared middleware (e.g. `requireAdmin`) once via `router.use(...)` at the top of the module rather than repeating it on each handler
- **Webhook idempotency:** Webhooks must dedupe by an external identifier (e.g. `Message-ID`) and return `200` on duplicates so the upstream service does not retry. Validate auth tokens via a query-string parameter compared against `process.env.<SECRET>` in middleware applied to the webhook route
- **Session reads in handlers:** Read the session from `res.locals.session` (set by `requireAuth` / `requireAdmin`). Don't re-call `auth.api.getSession` inside handlers
- **Server boot guards:** Required secrets (`BETTER_AUTH_SECRET`, `SENDGRID_WEBHOOK_SECRET`) are validated at process start in `server/src/index.ts` — the server refuses to boot if they're missing. Add new mandatory secrets to that block when introducing them
