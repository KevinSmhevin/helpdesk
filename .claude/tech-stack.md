# Tech Stack

## Backend
- **Runtime:** Node.js
- **Framework:** Express + TypeScript
- **Authentication:** Database sessions via `express-session` + `connect-pg-simple`

## Frontend
- **Framework:** React + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **Router:** React Router v6

## Database
- **Database:** PostgreSQL
- **ORM:** Prisma

## AI
- **Provider:** Anthropic (Claude)
- **SDK:** `@anthropic-ai/sdk`

## Email
- **Provider:** SendGrid
- **Inbound:** SendGrid Inbound Parse Webhook (converts inbound emails to HTTP POST requests)

## Background Jobs
- **Library:** pg-boss (PostgreSQL-backed job queue — no extra infrastructure needed)
- **Use cases:** AI response generation, ticket classification, email sending

## Deployment
- **Containerization:** Docker
- **Local orchestration:** Docker Compose (runs client, server, and PostgreSQL together)
- **Images:** separate Dockerfiles for `/client` and `/server`

## Dev Tooling
- **Monorepo:** npm workspaces (`/client`, `/server`)
- **Linting:** ESLint + Prettier
- **Environment:** dotenv
