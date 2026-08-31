# Phase 1 — Business State

**Status:** Implemented / Complete

Phase 1 schema, development database, bootstrap, and access layer are in place. Company Goal *rows* have not been defined yet; that is future operating-state population, not unfinished infrastructure. Phase 2 Command Center work has started separately (shell only in 2.1).

## Goals

Create the durable internal model JS OS will reason about: seven core entities, Prisma contract, referential integrity, Neon isolation, a reviewed development migration, initial JS Solutions configuration, and a typed service layer.

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
- Business-state access/service layer (`src/business-state`)
- Temporal polyfill in `src/prisma/db.ts`

## Checklist

```text
Business-state design                  Implemented
Prisma 8 contract                      Implemented
Neon development database              Implemented
Initial migration                      Implemented
Development schema verification        Implemented
Organization bootstrap                 Implemented
Initial AgentDefinitions               Implemented
Business-state access/service layer    Implemented
```

## Key decisions

See [business state](../architecture/business-state.md), [business-state services](../architecture/business-state-services.md), and:

- [ADR-004](../decisions/ADR-004-neon-environment-isolation.md) — environment isolation and URL split
- [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md) — AgentRun is audit; provenance Restrict
- [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md) — permission ceiling and approvals (intent)

Locked model rules include: one Organization entity; one WorkItem model; JS Growth canonical for product sales data; Approval ≠ execution; `permissionLevel` is a ceiling; AgentRun ≠ chat; BusinessEvent append-oriented with string `eventType`; JSON limited to four fields; internal provenance via FKs; `sourceType`/`sourceId` external only; no Goal hierarchy; no auth/org membership in v0.1.

Bootstrap creates missing Organization and AgentDefinition rows by natural key. It does not overwrite mutable fields on rerun.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm test
npm run business-state:verify
```

`npm run db:bootstrap` is development-only and is not a migration.

## Remaining work after Phase 1

- Deliberate Goal rows (operating-state population)
- Phase 2 Command Center UI

Not in Phase 1: tools, CEO loop, integrations, auth.
