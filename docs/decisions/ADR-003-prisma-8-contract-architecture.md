# ADR-003: Prisma 8 contract architecture

## Status

Accepted

## Context

JS OS needs durable relational business state. The project is new, pinned to Node 24, and has no Prisma 7 codebase to preserve. Prisma 8 is the current Prisma ORM line and is contract-first (`contract.prisma` → emit → migrate).

## Decision

Use PostgreSQL on Neon with Prisma ORM 8.

- Author in `src/prisma/contract.prisma` (PSL)
- Emit `contract.json` and `contract.d.ts` with `npm run contract:emit` (offline)
- Do not use Prisma 7 `@prisma/client` or `schema.prisma` conventions
- Do not use `db push` as the normal production schema strategy
- Never apply a migration before reviewing its plan

IDs are UUID (`Uuid @default(uuid())`). Timestamps are `timestamptz`. Mutable `updatedAt` uses `temporal.updatedAt()`.

## Consequences

- Team must use Prisma 8 commands (`contract emit`, `migration plan`, `db migrate`, `db verify`)
- Node 24 is required
- Contract artifacts are committed generated files
- Schema evolution is explicit and reviewable

## Alternatives considered

- Prisma 7: rejected; new system, Node 24, no legacy to keep.
- Share JS Growth’s database: rejected; see ADR-001 / ADR-002.
- Skip a database until UI exists: rejected; business state is the foundation for later agents.
