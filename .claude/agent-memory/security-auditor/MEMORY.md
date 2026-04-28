# Security Auditor Memory

- [Project security posture](project_security_posture.md) — Overall auth/authz architecture, key controls, and known gaps as of 2026-04-23
- [Critical findings](critical_findings.md) — No server-side admin enforcement; AdminRoute is client-side only
- [Auth controls in place](auth_controls.md) — Confirmed controls: disableSignUp, input:false on role field, ALLOWED_ORIGINS single source of truth
