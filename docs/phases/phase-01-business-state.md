# Phase 1 — Business State

**Status:** In progress

Phase 1 is not complete.

## Goals

Create the durable internal model JS OS will reason about: seven core entities, Prisma contract, referential integrity, Neon isolation, a reviewed development migration, and initial JS Solutions configuration.

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
- Initial Organization bootstrap (`js-solutions`)
- Initial AgentDefinitions (`ceo`, `sales`, `marketing`, `client-operations`, `engineering`, `finance`)

## Checklist

```text
Business-state design                 Implemented
Prisma contract                       Implemented
Development migration                 Implemented
Neon development database             Implemented
Initial organization bootstrap        Implemented
Initial AgentDefinitions              Implemented
Business-state access/service layer   Remaining
```

## Key decisions

See [business state](../architecture/business-state.md) and:

- [ADR-004](../decisions/ADR-004-neon-environment-isolation.md) — environment isolation and URL split
- [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md) — AgentRun is audit; provenance Restrict
- [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md) — permission ceiling and approvals (intent)

Locked model rules include: one Organization entity; one WorkItem model; JS Growth canonical for product sales data; Approval ≠ execution; `permissionLevel` is a ceiling; AgentRun ≠ chat; BusinessEvent append-oriented with string `eventType`; JSON limited to four fields; internal provenance via FKs; `sourceType`/`sourceId` external only; no Goal hierarchy; no auth/org membership in v0.1.

Bootstrap creates missing Organization and AgentDefinition rows by natural key. It does not overwrite mutable fields on rerun. Identity drift (wrong Organization name or AgentDefinition role) fails loudly. It is not a Prisma 7 seed framework. AgentDefinition rows are role definitions, not operational agents. Goals are deferred to a later deliberate step.

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

Development configuration (does not migrate):

```bash
npm run db:bootstrap
```

## Remaining work

- Business-state access/service layer
- Deliberate Goal rows (not in the initial bootstrap)

Not in Phase 1: Command Center UI, tools, CEO loop, integrations, auth.
