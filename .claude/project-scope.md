#AI-Powered Ticket Management System

## Problem
We receive hundres of support emails daily. Our agents manually read, classify and respond to each ticket - which is slow and leads to impersonal canned responses.


## Solution
Build a ticket management system that uses AI to automatically classify, respond to, and route support tickets - delivering faster, more personalized responses to students while freeing up agents for complex issues.


## Email Ingestion

- Emails are received via a shared inbox, integrated through SendGrid
- Inbound emails create new tickets automatically
- Replies to existing email threads are attached to the original ticket (not a new one)


## Knowledge Base

- Composed of internal docs and potentially a structured database
- Used by the AI to generate contextually relevant responses


## AI Response Logic

- When a ticket is created, the AI automatically generates a response using the knowledge base
- Responses are sent to the submitter without agent review (auto-send)
- Agents can view AI-generated responses in the ticket detail view
- Agents can also view AI-suggested replies for manual follow-ups


## Routing

- After classification, tickets are automatically assigned to a specific agent or team based on category


## Features

- Receive support emails and create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket list with filtering and sorting
- Ticket detail view
- AI-powered ticket classification
- AI summaries
- AI suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets


## Ticket Details

### Statuses
- **Open** — ticket has been received and is awaiting a response
- **Resolved** — a response has been sent to the submitter
- **Closed** — ticket is fully closed and no further action is needed

### Categories
- General Question
- Technical Question
- Refund Request


## User Roles

- **Admin** — seeded on deployment; can create and manage agents
- **Agent** — created by admin; can view, respond to, and manage tickets
