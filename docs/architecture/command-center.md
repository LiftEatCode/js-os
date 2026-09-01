# Command Center

**Status:** In progress. Milestones 2.1–2.6 (shell, Overview, Goals, Work, Activity, Approvals) are implemented. Later Command Center milestones are planned.

The Command Center is the internal JS OS operating interface for JS Solutions.

It should eventually answer:

> What is happening inside JS Solutions, what needs attention, and what is JS OS doing about it?

It is an internal business operating system, not a marketing analytics dashboard.

## Purpose

Give humans a persistent place to see business state, work, approvals, activity, agents, and operating knowledge.

## Information architecture

```text
Command Center
│
├── Overview
├── Goals
├── Work
├── Activity
├── Approvals
├── Agents
└── Knowledge
```

| Area | Purpose | Milestone |
|---|---|---|
| Overview | Current company state and owner attention | 2.2 Implemented |
| Goals | Strategic objectives and measurable progress | 2.3 Implemented |
| Work | WorkItems across JS Solutions | 2.4 Implemented |
| Activity | BusinessEvent operational history | 2.5 Implemented |
| Approvals | Human decision / authorization queue | 2.6 Implemented |
| Agents | Organizational AgentDefinitions and later activity | 2.7 Planned |
| Knowledge | Internal documentation browser | 2.8 Planned |

Routes and navigation exist for all seven areas. Agents and Knowledge remain placeholders until their milestones. Goals, Work, Activity, and Approvals are implemented.

## Route structure

URL namespace: `/app`.

The Next.js App Router lives in `src/app/`. The Command Center URL `/app` is the nested segment `src/app/app/`. Those names do not conflict.

```text
/                      Landing / development entry (not an auto-redirect)
/app                   Overview
/app/goals             Goal list (optional `?status=` filter)
/app/goals/new         Create Goal
/app/goals/[goalId]    Goal detail, edit, progress, status
/app/work                 WorkItem list (optional status/priority/workType filters)
/app/work/new             Create WorkItem
/app/work/[workItemId]    WorkItem detail, edit, status, assignment
/app/activity              BusinessEvent list (optional sourceType/eventType filters)
/app/activity/[eventId]    BusinessEvent detail (read-only)
/app/approvals             Approval list (optional status/riskLevel/requestedByType filters)
/app/approvals/new         Request Approval (manual owner-created)
/app/approvals/[approvalId] Approval detail and decisions
/app/agents
/app/knowledge
```

Do not use `/admin`. This is the operating interface, not a narrow administration panel.

## Navigation

Navigation items are defined once in `src/components/command-center/nav.tsx` (`COMMAND_CENTER_NAV`).

Desktop: persistent sidebar. Mobile: header Menu control opens a modal dialog using the same configuration. Active route uses `aria-current="page"`.

## Relationship to business state

```text
Command Center UI
        ↓
Server Actions (Approvals → business commands; Goals/Work → business-state)
        ↓
Business-State Services (`@/business-state`)
        ↓
Prisma (`src/prisma/db.ts`)
        ↓
Neon
```

Pages and layouts must not query Prisma directly. Reads go through `@/business-state`. Goal and Work mutations go through Command Center Server Actions, which call business-state services after a server-side write-access check. Approval mutations go through business commands so the Approval row and BusinessEvent commit together. Organization identity comes from `getJsSolutionsOrganization()` — never from a hardcoded UUID or browser form field.

## Overview (Milestone 2.2)

**Status:** Implemented

`/app` is request-time (`dynamic = 'force-dynamic'`). It does not cache a build-time snapshot of business state. There is no client fetching, polling, or API route for this page.

### Sections

- Organization identity (`name`, `status`, optional description)
- Summary counts: Active Goals, Open Work, Pending Approvals, Active Agents
- Owner Attention (derived)
- Active Goals preview
- Current open WorkItems (up to 5)
- Pending Approvals (up to 5; rows link to `/app/approvals/[approvalId]`; no approve/reject on Overview)
- Recent BusinessEvents (up to 8)
- Configured organizational AgentDefinitions

Real zeros and empty lists are displayed. No fabricated metrics.

### Open Work

Open Work is a Command Center definition, not a database field:

```text
WorkItem.status is not COMPLETED and not CANCELLED
```

That includes `BACKLOG`, `READY`, `IN_PROGRESS`, `BLOCKED`, and `WAITING_APPROVAL`.

### Owner Attention

Deterministic derived state in `src/command-center/overview/attention.ts`. It is not AI reasoning, not a policy engine, and not persisted.

Conditions (open work only where work is involved):

1. Critical open WorkItems (`priority = CRITICAL`)
2. Failed AgentRuns (`status = FAILED`)
3. Pending Approvals
4. Blocked open WorkItems (`status = BLOCKED`)
5. Overdue open WorkItems (`dueAt` before now)

A WorkItem appears in at most one group (critical, then blocked, then overdue). Ordering within groups: oldest created for critical/blocked, most recent failure for AgentRuns, oldest `requestedAt` for approvals, earliest `dueAt` for overdue.

Empty copy: “No items currently require owner attention.” That does **not** mean the business is healthy; it means no currently modeled attention conditions matched.

Presentation severity (`critical` / `warning` / `info`) is UI-only. It does not change stored WorkItem or Approval enums.

### AgentDefinitions

The Overview lists configured organizational roles. An AgentDefinition row is not an operational AI agent.

### Timestamps

Instants are formatted in the Organization timezone (`America/Chicago` for JS Solutions) using Temporal, not a separate date library. Date-only Goal target dates use `formatBusinessDate` in the same timezone.

Active Goal preview rows link to `/app/goals/[goalId]`. The section heading still links to `/app/goals`. After Goal mutations, Overview counts and the Active Goals list refresh via `revalidatePath('/app')`.

## Goals (Milestone 2.3)

**Status:** Implemented

Goals are strategic business state: what JS Solutions is intentionally trying to accomplish. Milestone 2.3 is owner-managed. It does not plan work, create WorkItems, recommend goals, or interpret metrics with AI.

### Reads and mutations

```text
Browser form
    ↓
Server Action (`src/command-center/goals/actions.ts`)
    ↓
validate input
    ↓
assert write access (development + explicit opt-in)
    ↓
getJsSolutionsOrganization()
    ↓
business-state Goal service
    ↓
revalidate /app, /app/goals, /app/goals/[goalId]
    ↓
redirect (create) or remain on detail (edit / progress / status)
```

The Server Action is the Command Center application boundary. The business-state service remains the persistence boundary.

List and detail pages are server-rendered (`dynamic = 'force-dynamic'`). Small Client Components (`GoalForm`, `GoalProgressForm`) exist only for pending state and action errors.

### List behavior

`/app/goals` loads Goals for the JS Solutions Organization. Optional `?status=` filters to one persisted status. `All` is the default (no status param). Filtering is server-side.

Ordering is applied in Command Center code after `listGoals()` (the service orders by `createdAt` desc only):

```text
status:    ACTIVE, DRAFT, PAUSED, ACHIEVED, CANCELLED
priority:  CRITICAL, HIGH, MEDIUM, LOW
then:      earliest targetDate (nulls last)
then:      newest createdAt
```

ACHIEVED and CANCELLED remain visible and filterable; they are slightly de-emphasized in the list. There is no Goal deletion. Cancel by setting status to `CANCELLED`.

Empty copy: “No goals have been defined yet.” When writes are disabled, creation is not offered.

### Creation and editing

Create form defaults (UI only): status `DRAFT`, priority `MEDIUM`, time horizon `QUARTERLY`. Required fields: title, status, priority, time horizon. Optional: description, target date, metric name/unit, target/current values.

Editable on detail: title, description, status, priority, time horizon, target date, metric fields. Not editable: `id`, `organizationId`, `createdAt`, `updatedAt`, `completedAt`.

Progress uses `updateGoalProgress()` and updates `currentValue` only.

### Metric display

The Goal model has no metric direction (higher-is-better vs lower-is-better). Command Center therefore **does not** compute a universal completion percentage from `current / target`. It displays stored Current, Target, Metric, and Unit values. Goals without a metric show “No metric defined.”

Numeric fields are validated and passed as decimal **strings**. Empty optional numerics become `null` (cleared). `parseFloat` is not used.

### `completedAt`

The UI never writes `completedAt`. `createGoal` / `updateGoal` own the lifecycle:

- Entering `ACHIEVED` sets `completedAt` if it is empty.
- Leaving `ACHIEVED` clears `completedAt`.
- Other status changes leave it unchanged.

### Write-access safeguard

The Command Center is unauthenticated. Goal mutations are **not** generally enabled.

Writes are allowed only when **both** are true:

```text
NODE_ENV === "development"
JS_OS_COMMAND_CENTER_WRITES === "true"
```

Default is disabled (`.env.example` sets `JS_OS_COMMAND_CENTER_WRITES=false`). Enforcement is server-side in `src/command-center/write-access.ts`. Hidden buttons are not the protection. When disabled, the UI shows a restrained read-only notice and mutations return “Command Center writes are disabled.”

This is a temporary development safeguard. Authentication will replace it. It is not an ADR.

### BusinessEvent auditing

Goal management mutates Goal business state only. There is no atomic mutation-plus-BusinessEvent command pattern today. Unified mutation-to-BusinessEvent auditing remains a future cross-cutting concern. Goal Server Actions do not write demonstration events.

### Not in 2.3

Agent planning, automatic Goal or WorkItem creation, Goal hierarchy, recommendations, scoring, AI interpretation, tools, integrations, auth, deletion, progress history/charts, or a generic workflow engine.

## Work (Milestone 2.4)

**Status:** Implemented

WorkItems are execution state: what needs to happen to move the business forward. Milestone 2.4 is owner-managed. Assigning an AgentDefinition does not start an AgentRun and does not make that role operational.

### Routes and mutations

Same Server Action pattern as Goals: parse → write-access check → `getJsSolutionsOrganization()` → verify linked Goal / parent / AgentDefinition belong to JS Solutions → WorkItem service → revalidate `/app`, `/app/work`, `/app/work/[id]`. Create redirects to detail. Edit remains on detail.

The same `JS_OS_COMMAND_CENTER_WRITES` safeguard applies. There is no Work-specific flag.

### List

Server-rendered. Filters: `status`, `priority`, and `workType` may be combined. Ordering after `listWorkItems()` (`createdAt` desc in the service):

```text
status:    IN_PROGRESS, BLOCKED, WAITING_APPROVAL, READY, BACKLOG, COMPLETED, CANCELLED
priority:  CRITICAL, HIGH, MEDIUM, LOW
then:      earliest dueAt (nulls last)
then:      newest createdAt
```

Open work = not `COMPLETED` and not `CANCELLED`. Terminal work stays visible and slightly de-emphasized. Empty copy: “No work items have been defined yet.”

### Creation and editing

Form defaults only: status `BACKLOG`, priority `MEDIUM`, work type `TASK`. No default Goal, parent, or assignee.

Editable: title, description, status, priority, workType, goalId, parentId, assignedAgentId, dueAt. Not editable: id, organizationId, agentRunId, sourceType, sourceId, startedAt, completedAt, createdAt, updatedAt.

`sourceType` / `sourceId` are integration provenance. Owner-created work leaves them null. They may be shown read-only when present. `agentRunId` is the creating AgentRun for future agent workflows and is never owner-editable. This milestone does not create AgentRuns.

### Goal, assignee, parent

Linked Goals and AgentDefinitions are loaded through `@/business-state` and verified against the JS Solutions Organization. Assignee UI copy is “Configured assignee,” not “agent currently working.”

Parent/child is a simple optional `parentId`. Detail shows direct children only. A WorkItem cannot parent itself or become its own ancestor (`wouldCreateParentCycle`). There is no tree editor.

### Lifecycle timestamps

Owned by the WorkItem service:

- First entry into `IN_PROGRESS` sets `startedAt` if empty. Later changes do not reset it.
- Entering `COMPLETED` sets `completedAt` if empty.
- Leaving `COMPLETED` clears `completedAt`.
- `CANCELLED` is not completion and does not set `completedAt`.

The UI never writes these fields. There is no deletion; use `COMPLETED` or `CANCELLED`.

### Status semantics

The owner may move among persisted statuses. No transition policy engine yet.

`WAITING_APPROVAL` means the WorkItem is marked as waiting for authorization. It does **not** create an Approval record. Approval is a separate model; Command Center Approvals (2.6) do not auto-synchronize this status.

`BLOCKED` is a status only. No blocker entity or dependency graph.

Overdue is derived (`dueAt < now` and open). It is not persisted.

### Overview

Work mutations revalidate `/app`. Open Work count, Current Work, and Owner Attention (critical / blocked / overdue open work) update from the same services. Current Work rows and attention work items link to `/app/work/[workItemId]`.

### BusinessEvent

WorkItem mutations do not write BusinessEvents. Same audit gap as Goals.

### Not in 2.4

Agent-created work, automatic planning/decomposition, tool or approval execution, workflow engines, workers, schedulers, deletion, or fabricated AgentRuns/Approvals.

## Activity (Milestone 2.5)

**Status:** Implemented

Activity answers: what has happened inside JS OS. It is a read-only view of append-only BusinessEvents. There is no create/edit/delete UI, even when Command Center writes are enabled. Events are produced by business operations, not by Activity.

### List and detail

`/app/activity` is server-rendered (`dynamic = 'force-dynamic'`). Default page size is 50 (`listBusinessEvents` limit; optional `?limit=` is clamped 1–200). Ordering is most recent `occurredAt`, then `createdAt`, then `id`.

Filters are GET search params: `sourceType` (known enum) and `eventType` (exact string match — not a frontend enum). Unknown `eventType` values still render if they exist.

Empty copy: “No business events have been recorded yet.” That is a valid development state. Approval Command Center mutations now append events atomically. Goal and Work mutations have not been migrated onto the atomic command boundary, so those owner edits still do not appear here.

Detail (`/app/activity/[eventId]`) shows title, description, eventType, sourceType, sourceId, occurredAt, createdAt, and metadata. Missing, invalid, or other-organization IDs are not found.

### Formatting

`eventType` is shown as a readable label plus the exact stored value (`work.completed` → Work Completed). Arbitrary future types such as `new.integration.event` still format. Source enums display as User, System, Agent, JS Growth, GitHub, and so on. A source enum does not mean that integration is active.

Metadata is pretty-printed JSON in a `<pre>` block. Null metadata shows “No metadata recorded.” HTML is never interpreted.

`sourceType` / `sourceId` identify the event source, not automatically the affected Goal or WorkItem. Activity does not invent related-entity links from those fields.

### Overview

Recent Activity continues to use `listRecentBusinessEvents()`. Rows link to `/app/activity/[eventId]`. The section still links to `/app/activity`.

### Command boundary

Prisma 8 PostgreSQL supports `db.transaction`. Consequential mutations that should appear in history go through `src/business-commands/` so the state write and BusinessEvent append commit together. See [ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md). Approval Server Actions use that boundary. Goal and Work Server Actions still call business-state services only.

## Approvals (Milestone 2.6)

**Status:** Implemented

Approvals answer: what proposed actions need owner authorization, and what has already been decided. Approval is authorization, not execution (`APPROVED ≠ EXECUTED`). After approve/reject/cancel, only the Approval row and a BusinessEvent change.

### Routes and mutations

```text
/app/approvals
/app/approvals/new
/app/approvals/[approvalId]
```

Reads through `@/business-state` with `getJsSolutionsOrganization()`. Mutations: Server Action → write-access check → parse → org and related-entity checks → business command (`tx.orm` Approval mutation + BusinessEvent) → revalidate `/app`, `/app/activity`, `/app/approvals`, `/app/approvals/[id]`. Create redirects to detail.

The same `JS_OS_COMMAND_CENTER_WRITES` safeguard applies. There is no Approval-specific flag.

Request fields are immutable after creation. There is no edit form and no deletion.

### List

Server-rendered. Pending first, then risk `CRITICAL` → `LOW`, then oldest `requestedAt`. Terminal records follow, most recently decided. Filters: `status`, `riskLevel`, `requestedByType` (GET, combinable; unknown values ignored). Risk is shown as text. Pending rows are labeled “Needs decision.” A pending request whose `expiresAt` is past shows “Past expiration time” without changing stored status.

### Creation

Manual owner form: required title, actionType (`lowercase.dot.notation`), risk. Optional description, WorkItem, expiration, JSON payload. `requestedByType` is fixed to `USER`; `requestedById` is null (no auth — no fabricated UUID). AgentRun is not selectable. Creating an Approval does not set a linked WorkItem to `WAITING_APPROVAL`.

### Detail and decisions

Full request, payload JSON, related WorkItem (link to `/app/work/[id]`), related AgentRun (read-only; no AgentRun route yet). PENDING + writes: Approve / Reject / Cancel POST forms. Rejection requires a reason. CRITICAL requires a confirmation checkbox (server-validated). Terminal rows have no decision controls.

### Overview and Activity

Pending Approval rows and Owner Attention link to `/app/approvals/[approvalId]`. Events `approval.requested` / `approval.approved` / `approval.rejected` / `approval.cancelled` appear on Activity. Overview pending count uses `listPendingApprovals()`.

### Not in 2.6

Tool execution, automatic Approval creation from `WAITING_APPROVAL`, approval chains, RBAC, expiration workers, notifications, queues, or fabricated Approvals.

## Knowledge / documentation

Markdown files under `docs/` remain the canonical source of truth.

The future Knowledge UI renders and navigates that source. It does not create a second documentation database. Milestone 2.1 only establishes the `/app/knowledge` destination.

## Authentication

**Status:** Future

The Command Center is currently unauthenticated development functionality. Do not treat `/app` as private.

## Environment indicator

The sidebar System area shows `Development` or `Production` from `NODE_ENV`. It does not expose hosts, connection strings, or credentials. `next start` therefore labels Production even on a developer machine. That is a known Milestone 2.1 limitation; it is not inferred from the Neon hostname. Do not treat the label as write-access state — writes use the separate `JS_OS_COMMAND_CENTER_WRITES` check above.

## What 2.1–2.6 do not include

- Agent *management* UIs
- Approval or AgentRun actions from Overview
- Documentation renderer / MDX
- Auth
- Tools, agents, orchestration, APIs created for their own sake
- Goal, WorkItem, or Approval deletion
- Goal/Work mutation migration onto atomic BusinessEvent commands
- Manual Activity event authoring
- Approval execution after `APPROVED`

## Related

- [Phase 2](../phases/phase-02-command-center.md)
- [Business-state services](business-state-services.md)
- [Architecture overview](overview.md)
