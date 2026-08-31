# Phase 1 — Business State

**Status:** In progress

Phase 1 is not complete.

## Goals

Create the durable internal model JS OS will reason about: seven core entities, Prisma contract, referential integrity, Neon isolation, and a reviewed development migration.

## Completed work

- Data-model design (locked v0.1 decisions)
- Seven entities: Organization, Goal, WorkItem, BusinessEvent, Approval, AgentDefinition, AgentRun
- Prisma 8 contract implementation in `src/prisma/contract.prisma`
- Emitted `contract.json` / `contract.d.ts`
- Referential integrity: no Cascade; Restrict on organization history and AgentRun provenance; SetNull on selected optional links
- Neon project with isolated production and development branches
- Connection split: `DATABASE_URL` (pooled runtime) and `DIRECT_URL` (CLI)
- `.env.local` for local secrets (gitignored)
- Initial migration `migrations/app/20260831T1616_initial_business_state` planned and applied to **development**
- Development schema verification against that migration

## Key decisions

See [business state](../architecture/business-state.md) and:

- [ADR-004](../decisions/ADR-004-neon-environment-isolation.md) — environment isolation and URL split
- [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md) — AgentRun is audit; provenance Restrict
- [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md) — permission ceiling and approvals (intent)

Locked model rules include: one Organization entity; one WorkItem model; JS Growth canonical for product sales data; Approval ≠ execution; `permissionLevel` is a ceiling; AgentRun ≠ chat; BusinessEvent append-oriented with string `eventType`; JSON limited to four fields; internal provenance via FKs; `sourceType`/`sourceId` external only; no Goal hierarchy; no auth/org membership in v0.1.

## Validation

Contract emit is offline:

```bash
npm run contract:emit
```

Application:

```bash
npm run typecheck
npm run lint
npm run build
```

Database verify/migrate were used against **development** during this phase. Do not re-run mutating database commands from documentation tasks.

## Remaining work

- Bootstrap/seed initial JS Solutions business state
- Business-state access/service layer

Not in Phase 1: Command Center UI, tools, CEO loop, integrations, auth.
