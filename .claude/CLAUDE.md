# Helpdesk

AI-powered ticket management system. Receives support emails, classifies them, auto-generates responses via Claude, and routes tickets to agents.

## Docs

Use Context7 MCP (`resolve-library-id` → `query-docs`) to fetch up-to-date documentation before working with any library. Do not rely on training data for library APIs.

## Stack

- **Runtime:** Bun
- **Backend:** Express + TypeScript (`/server`)
- **Frontend:** React + Vite + TypeScript + Tailwind v4 + React Router v6 (`/client`)
- **Database:** PostgreSQL via Prisma
- **Auth:** Database sessions (`express-session` + `connect-pg-simple`)
- **AI:** Anthropic Claude (`@anthropic-ai/sdk`)
- **Email:** SendGrid (inbound parse webhook)
- **Background jobs:** pg-boss

## Structure

```
helpdesk/
├── client/          # React frontend
│   └── src/
├── server/          # Express backend
│   ├── src/
│   │   └── lib/prisma.ts
│   └── prisma/
│       └── schema.prisma
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
```

## Environment

Copy `server/.env` from `.env.example`. Required vars:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — express-session secret
- `ANTHROPIC_API_KEY`
- `SENDGRID_API_KEY`

## Domain

- **Ticket statuses:** open, resolved, closed
- **Ticket categories:** General Question, Technical Question, Refund Request
- **Roles:** admin (seeded on deploy), agent (created by admin)
- **AI responses:** auto-sent on ticket creation, no agent approval needed
- **Email:** inbound via SendGrid parse webhook; replies thread to existing tickets
- **Routing:** tickets auto-assigned to agent/team based on category
