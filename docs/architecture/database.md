# Database architecture

**Status:** Implemented (foundation + Phase 1 contract + development schema)

Stack:

```text
Database: PostgreSQL
Provider: Neon
ORM: Prisma ORM 8
```

JS OS has its own database. JS Growth also uses PostgreSQL/Neon. The databases are independent. See [system boundaries](system-boundaries.md).

## Why this stack

- PostgreSQL fits relational business state: organizations, goals, work, approvals, events, agent runs.
- Prisma 8 is the current Prisma ORM line and requires Node 24, which JS OS is pinned to.
- There is no legacy Prisma 7 implementation to preserve.
- Neon provides managed PostgreSQL for serverless Next.js on Vercel.

Do not add FastAPI, queues, workers, or LLM infrastructure until a feature requires them.

## Prisma 8 contract

Prisma 8 is contract-first. It is not Prisma 7 `schema.prisma` + `@prisma/client`.

```text
contract source:  src/prisma/contract.prisma
emitted:          src/prisma/contract.json
                  src/prisma/contract.d.ts
runtime client:   src/prisma/db.ts  (not used by app routes yet)
CLI config:       prisma.config.ts
```

Workflow:

```text
edit contract.prisma
  → npm run contract:emit     (offline)
  → review migration plan
  → db migrate                (database-mutating, development only)
  → db verify
```

Never apply a migration before reviewing its plan.

Do not use `prisma db push` as the normal production strategy.

Authoritative domain decisions: [business state](business-state.md).

## Current state

**Implemented:**

- Phase 1 models in the Prisma contract
- Isolated Neon production and development branches
- Development database connected
- Initial business-state migration planned and applied to development
- CLI loads `.env.local` and uses `DIRECT_URL`
- Runtime client uses `DATABASE_URL`

**Not implemented:**

- Production migration of later schema changes (follow the same plan-then-migrate rule)
- Preview/staging database
- Seed data
- Application query layer

## Connection split

```text
DATABASE_URL  → Neon pooled connection → application runtime (src/prisma/db.ts)
DIRECT_URL    → Neon direct connection → Prisma CLI/admin (prisma.config.ts)
```

Local secrets live in gitignored `.env.local`. `.env.example` has empty placeholders only. Never commit credentials. Never expose them as `NEXT_PUBLIC_*`. Database access is server-side only.

## Isolation

> Development, preview, test, and production database activity must be isolated. No development command, migration experiment, seed script, automated test, or preview deployment should be capable of mutating the production database.

```text
Local development  → Neon development branch
Production         → Neon production branch
Preview            → future isolated environment
```

Application request handling must not run schema-management commands (`db init`, `db update`, `db migrate`, `db sign`).

See [environments](../development/environments.md) and [database workflow](../development/database-workflow.md).

## IDs and timestamps

- Primary keys and UUID foreign keys use Prisma 8 `Uuid` with `@default(uuid())`.
- No numeric auto-increment IDs.
- Timestamps are PostgreSQL `timestamptz` (UTC). UI may display Organization timezone.
- Mutable `updatedAt` uses Prisma 8 `temporal.updatedAt()` (not Prisma 7 `@updatedAt`).

## JSON

Only these v0.1 fields are JSON (`Jsonb`):

```text
BusinessEvent.metadata
Approval.payload
AgentRun.inputSnapshot
AgentRun.output
```

## Audit retention

- Prefer status changes over deletion.
- BusinessEvents are append-oriented (no `updatedAt`).
- AgentRuns preserve input/output/error.
- Approval records preserve request and decision.
- No Cascade in v0.1. See [business state](business-state.md) for Restrict vs SetNull.

## Operational rules

```text
- Never run local migrations against production.
- Never point Preview at production.
- Never commit database credentials.
- Never use db push as the normal production migration strategy.
- Commit every production migration.
- Protect production data before risky schema changes.
- Keep JS OS and JS Growth databases independently deployable.
- Never apply a migration before reviewing its plan.
```

## Related

- [ADR-003](../decisions/ADR-003-prisma-8-contract-architecture.md)
- [ADR-004](../decisions/ADR-004-neon-environment-isolation.md)
