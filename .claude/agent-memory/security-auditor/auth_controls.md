---
name: Auth controls confirmed in place
description: Security controls correctly implemented as of 2026-04-23 audit
type: project
---

Controls verified correct:
- better-auth emailAndPassword.disableSignUp: true (auth.ts line 10) — self-registration blocked
- role additionalField has input: false (auth.ts line 18) — role cannot be set via client-supplied sign-in/update payload
- Role is a Postgres enum (schema.prisma line 11-14) — DB-level constraint prevents invalid values
- ALLOWED_ORIGINS is parsed once and shared with both cors() middleware and betterAuth trustedOrigins — no drift risk
- .env excluded from git via root .gitignore
- Seed uses hashPassword from better-auth/crypto (seed.ts line 2) — same algorithm Better Auth expects
- Session.onDelete Cascade in schema — sessions are cleaned up when user is deleted
- Session.token has @@unique constraint — no token collision possible
- LoginPage uses zod + react-hook-form validation before submitting credentials
- authClient is a singleton (auth-client.ts) — no duplicate session state
