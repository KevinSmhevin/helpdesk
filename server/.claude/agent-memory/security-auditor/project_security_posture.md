---
name: Project security posture
description: Overall auth/authz architecture, key controls present, and known gaps as of 2026-04-23
type: project
---

Auth is Better Auth v1 with Prisma adapter on PostgreSQL. Email/password only, sign-up disabled (disableSignUp: true). Roles are admin|agent stored as a Postgres enum on the User table.

Key controls confirmed present:
- disableSignUp: true in auth.ts — prevents self-registration
- role field has `input: false` in Better Auth additionalFields — prevents clients from setting role at sign-in/profile-update time
- ALLOWED_ORIGINS drives both cors() and trustedOrigins — single source of truth, no hardcoding
- .env is in root .gitignore, not committed
- hashPassword from better-auth/crypto used in seed — correct library-native hashing

Critical gap (as of audit 2026-04-23):
- AdminRoute is client-side only. /api/users (and any future admin API routes) have NO server-side role check. Any authenticated user can call admin endpoints directly.
- No auth middleware helper exists in server/src/ — each route must manually call auth.api.getSession()
- No security headers (Helmet not installed, X-Powered-By not removed)
- No rate limiting on /api/auth/* routes
- Session cookie flags not explicitly configured (relying on Better Auth defaults)
- .env.example has BETTER_AUTH_SECRET=change-me — weak placeholder

**Why:** App is early-stage; admin route enforcement and security hardening have not yet been implemented.
**How to apply:** When adding any new Express route that should be admin-only, always add a server-side getSession() check and role assertion before route handler logic.
