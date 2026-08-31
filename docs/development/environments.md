# Environments

**Status:** Implemented for local development vs production Neon branches. Preview isolation is future.

```text
Local development  → Neon development branch
Production         → Neon production branch
Preview            → future isolated environment strategy
```

## Why isolation matters

JS OS will store goals, work, approvals, events, and agent-run history. Accidental writes to production would corrupt operating state and audit records.

> Development, preview, test, and production database activity must be isolated. No development command, migration experiment, seed script, automated test, or preview deployment should be capable of mutating the production database.

## Current mapping

| Environment | App | Database |
|---|---|---|
| Local development | `npm run dev` | Neon development branch via `.env.local` |
| Production | future Vercel production | Neon production branch |
| Preview / staging | future | must not use production credentials |

`DATABASE_URL` is pooled (runtime). `DIRECT_URL` is direct (Prisma CLI). Each environment has its own pair. See [ADR-004](../decisions/ADR-004-neon-environment-isolation.md).

Local development uses the Neon development branch via `.env.local`. `npm run db:bootstrap` is development-only (`JS_OS_BOOTSTRAP_TARGET=development`). Production bootstrap is not supported.

## Not implemented

- Preview/staging Neon branch or per-PR databases
- Production deploy pipeline
- Automated tests against an isolated test database

Whether Preview uses one persistent staging database or per-branch Neon databases is still open. The constraint is fixed: Preview never shares production.
