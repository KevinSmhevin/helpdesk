# Implementation Plan

## Phase 1 — Project Setup & Infrastructure

- [x] Initialize monorepo with Bun workspaces (`/client`, `/server`)
- [x] Scaffold Express + TypeScript server
- [x] Scaffold React + Vite + TypeScript client
- [x] Configure ESLint + Prettier across both packages
- [x] Set up dotenv for environment variables
- [ ] Setup and connect to PostgreSQL and confirm connection


## Phase 2 — Authentication

- [ ] Define `User` schema in Prisma (id, email, password hash, role: admin | agent)
- [ ] Seed admin user on startup
- [ ] Implement `express-session` + `connect-pg-simple` for database-backed sessions
- [ ] `POST /auth/login` — validate credentials, create session
- [ ] `POST /auth/logout` — destroy session
- [ ] `GET /auth/me` — return current session user
- [ ] Auth middleware to protect API routes
- [ ] Login page (React)
- [ ] Protected route wrapper in React Router
- [ ] Redirect unauthenticated users to login


## Phase 3 — Ticket Core

- [ ] Define `Ticket` schema in Prisma (id, subject, body, status, category, submitter email, assigned agent, timestamps)
- [ ] `GET /tickets` — list tickets with filtering (status, category) and sorting
- [ ] `GET /tickets/:id` — ticket detail
- [ ] `PATCH /tickets/:id` — update status or assignment
- [ ] Ticket list page with filter and sort controls
- [ ] Ticket detail page


## Phase 4 — Email Ingestion

- [ ] Create SendGrid inbound parse webhook endpoint (`POST /webhooks/email`)
- [ ] Parse inbound email payload and create a new ticket
- [ ] Reply threading — match inbound replies to existing tickets by thread/message ID
- [ ] Outbound email helper using SendGrid to send responses to submitters


## Phase 5 — AI Features

- [ ] Set up Anthropic SDK (`@anthropic-ai/sdk`)
- [ ] Set up pg-boss job queue
- [ ] Background job: AI ticket classification (assign category on ticket creation)
- [ ] Background job: AI auto-response generation using knowledge base
- [ ] Auto-send AI-generated response to submitter via SendGrid
- [ ] Background job: AI ticket summary generation
- [ ] AI suggested replies endpoint (for agent use in ticket detail view)
- [ ] Display AI summary and suggested replies in ticket detail UI


## Phase 6 — Knowledge Base

- [ ] Define `KnowledgeBaseEntry` schema in Prisma (id, title, content, category, timestamps)
- [ ] CRUD API endpoints for knowledge base (admin only)
- [ ] Knowledge base management UI (admin only)
- [ ] Wire knowledge base entries into AI response and suggested reply prompts


## Phase 7 — Routing & Assignment

- [ ] Define assignment rules: map ticket category to agent or team
- [ ] Auto-assign ticket to the correct agent on creation (after classification)
- [ ] Display assigned agent on ticket detail
- [ ] Allow admin to manually reassign a ticket


## Phase 8 — User Management

- [ ] `GET /users` — list all agents (admin only)
- [ ] `POST /users` — create a new agent (admin only)
- [ ] `PATCH /users/:id` — update or deactivate an agent (admin only)
- [ ] User management page (admin only)
- [ ] Hide admin-only UI from agent role


## Phase 9 — Dashboard

- [ ] `GET /stats` — aggregate ticket counts by status and category
- [ ] Dashboard page with summary stats (open, resolved, closed tickets)
- [ ] Breakdown by category
- [ ] Recent tickets list on dashboard


## Phase 10 — Polish & Deployment

- [ ] Add error handling middleware to Express
- [ ] Form validation on the frontend
- [ ] Empty states and loading states throughout the UI
- [ ] Production Docker build optimizations
- [ ] Environment variable documentation (`.env.example`)
- [ ] End-to-end QA of all major flows
