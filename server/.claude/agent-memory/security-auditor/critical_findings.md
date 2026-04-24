---
name: Critical findings — no server-side admin enforcement
description: AdminRoute is client-side only; no server-side middleware guards admin API endpoints
type: project
---

As of 2026-04-23 audit: AdminRoute in client/src/App.tsx only hides the /users page in the browser. There is no corresponding server-side role check on any Express route. Any authenticated user (role=agent) can call admin API endpoints (e.g., future POST /api/users) by issuing raw HTTP requests.

No auth middleware helper exists in server/src/. Developers must remember to call `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` and check `session.user.role` manually on every protected route.

**Why:** The /users page is a stub (returns only a heading). No admin API routes exist yet — but the pattern is missing before they get added.
**How to apply:** Before implementing any admin API route, create a reusable requireAuth/requireAdmin middleware in server/src/lib/middleware.ts and apply it. Audit any new route addition for missing middleware.
