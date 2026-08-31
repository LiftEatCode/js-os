# Business-state services

**Status:** Implemented

Typed application functions over the Phase 1 Prisma 8 contract. Future UI, agents, and tools should use this module instead of calling Prisma from many places.

```text
UI / future agents / future tools
               ↓
       Business-State Services
               ↓
             Prisma (src/prisma/db.ts)
               ↓
              Neon
```

Import from `@/business-state`. Do not import `db` from that entrypoint.

```ts
import {
  getJsSolutionsOrganization,
  listActiveGoals,
  listWorkItems,
  listPendingApprovals,
  listActiveAgentDefinitions,
  listRecentBusinessEvents,
} from "@/business-state";
```

## What it owns

Persistence operations for Organization, Goal, WorkItem, BusinessEvent, Approval, AgentDefinition, and AgentRun.

## What it does not own

- Generic repository/CRUD frameworks
- Policy evaluation
- Tool execution
- Agent reasoning or model calls
- Queues, workers, REST APIs, or UI
- Auth / organization membership

## Centralized database access

All services use the single runtime in `src/prisma/db.ts` (`DATABASE_URL`). That module loads `.env.local` and initializes Temporal via `temporal-polyfill/full/global` before queries run.

Callers must not create additional Prisma clients.

## Organization scoping

List and create operations take `organizationId`. The data model is multi-organization capable.

`getJsSolutionsOrganization()` is a convenience for the bootstrapped company (`slug: js-solutions`). It **throws** `BusinessStateNotFoundError` if that row is missing. Other `get*ById` methods return `null` when not found.

UUIDs are never hardcoded.

## BusinessEvent

Append-only. `recordBusinessEvent()` creates rows. There is no update or delete API.

`eventType` must be `lowercase.dot.notation` (for example `lead.created`).

## Approval

Authorization only. `approveApproval` / `rejectApproval` / `cancelApproval` change status and `decidedAt`. They do not execute the proposed action.

Decisions are allowed only from `PENDING`.

## AgentDefinition

Role configuration, not an operational agent.

```text
AgentDefinition exists
≠
operational autonomous agent exists
```

`permissionLevel` is a ceiling. These services do not enforce tool permissions.

## AgentRun

Audit/lifecycle records only. Methods persist `QUEUED` → `RUNNING` → `COMPLETED` / `FAILED`, or cancel from `QUEUED`/`RUNNING`. They do not invoke a model.

The v0.1 contract requires `startedAt` on create, so `createAgentRun` sets it when the run is queued. `markAgentRunRunning` refreshes `startedAt` at actual start.

## Temporal

Prisma 8 `timestamptz` codecs and `temporal.updatedAt()` need a global `Temporal` implementation.

JS OS installs `temporal-polyfill` and imports `temporal-polyfill/full/global` in `src/prisma/db.ts`. CLI scripts that import `db` (bootstrap, verify) do not need `--harmony-temporal`.

## Errors

- `BusinessStateNotFoundError`
- `InvalidBusinessStateInputError`
- `InvalidBusinessStateTransitionError`

Prisma integrity errors are not swallowed.

## Tests and verification

Unit tests cover validation and lifecycle helpers (`npm test`). There is no isolated mutating test database yet, so services are not integration-tested against Neon in CI.

Read-only development check:

```bash
npm run business-state:verify
```

That uses the service layer to read the bootstrapped Organization and six AgentDefinitions. It does not write.

## Related

- [Business state](business-state.md)
- [Database](database.md)
- [Phase 1](../phases/phase-01-business-state.md)
