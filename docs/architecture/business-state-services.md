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
- Command Center Owner Attention projection (derived in `src/command-center/overview/`)
- Command Center Goal list ordering, form parsing, and write-access gating (`src/command-center/`)
- Auth / organization membership

## Goal services

```text
getGoalById
listGoals            optional status / priority / timeHorizon; createdAt desc
listActiveGoals      status ACTIVE
createGoal
updateGoal
updateGoalProgress   currentValue only; delegates to updateGoal
```

`createGoal` defaults status to `DRAFT` when omitted. If the created status is `ACHIEVED`, it sets `completedAt` to now; otherwise `completedAt` is null.

`updateGoal` applies `nextGoalCompletedAt` when `status` is present. Callers must not treat `completedAt` as a UI field.

Numeric `targetValue` / `currentValue` are Prisma `numeric` values. Application code should pass decimal strings and avoid `parseFloat`. Empty optional numerics are stored as `null`.

## WorkItem services

```text
getWorkItemById
listWorkItems          optional status / priority / workType / goalId / assignedAgentId / parentId; createdAt desc
createWorkItem
updateWorkItem
updateWorkItemStatus   status only; delegates to updateWorkItem
wouldCreateParentCycle ancestry invariant (pure helper)
```

`createWorkItem` defaults status to `BACKLOG`. Lifecycle timestamps are applied on create and whenever `updateWorkItem` receives a status:

- First entry to `IN_PROGRESS` sets `startedAt` if empty. Later changes do not reset it.
- Entering `COMPLETED` sets `completedAt` if empty. Leaving `COMPLETED` clears it.
- `CANCELLED` does not set `completedAt`.

`listWorkItems` can filter `parentId` so Command Center can load direct children without a generic graph query.

Command Center Work forms do not pass `sourceType`, `sourceId`, or `agentRunId`. Those remain service-level fields for integrations and future AgentRuns.

## Centralized database access

All services use the single runtime in `src/prisma/db.ts` (`DATABASE_URL`). That module initializes Temporal via `temporal-polyfill/full/global` before queries run. CLI scripts load `.env.local` from this module when `DATABASE_URL` is not already set; Next.js injects `.env.local` itself.

Callers must not create additional Prisma clients.

## Organization scoping

List and create operations take `organizationId`. The data model is multi-organization capable.

`getJsSolutionsOrganization()` is a convenience for the bootstrapped company (`slug: js-solutions`). It **throws** `BusinessStateNotFoundError` if that row is missing. Other `get*ById` methods return `null` when not found.

UUIDs are never hardcoded.

## BusinessEvent

Append-only. `recordBusinessEvent()` creates rows. There is no update or delete API.

`eventType` must be `lowercase.dot.notation` (for example `lead.created`).

There is no transactional “mutate Goal or WorkItem + record BusinessEvent” helper. Command Center Goal and Work Server Actions therefore persist those rows only. Unified mutation-to-BusinessEvent auditing is a future cross-cutting concern.

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

Unit tests cover validation, Goal `completedAt` lifecycle, WorkItem lifecycle and parent-cycle checks, Command Center write-access, Goal/Work list ordering, and form parsing (`npm test`). There is no isolated mutating test database yet, so services are not integration-tested against Neon in CI.

Read-only development check:

```bash
npm run business-state:verify
```

That uses the service layer to read the bootstrapped Organization and six AgentDefinitions. It does not write.

## Related

- [Business state](business-state.md)
- [Command Center](command-center.md)
- [Database](database.md)
- [Phase 1](../phases/phase-01-business-state.md)
