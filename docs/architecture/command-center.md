# Command Center

**Status:** In progress. Milestones 2.1 (shell + navigation), 2.2 (business overview), and 2.3 (Goals) are implemented. Later Command Center milestones are planned.

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
| Work | WorkItems across JS Solutions | 2.4 Planned |
| Activity | BusinessEvent operational history | 2.5 Planned |
| Approvals | Human decision / authorization queue | 2.6 Planned |
| Agents | Organizational AgentDefinitions and later activity | 2.7 Planned |
| Knowledge | Internal documentation browser | 2.8 Planned |

Routes and navigation exist for all seven areas. Work, Activity, Approvals, Agents, and Knowledge remain placeholders until their milestones. Goals is implemented.

## Route structure

URL namespace: `/app`.

The Next.js App Router lives in `src/app/`. The Command Center URL `/app` is the nested segment `src/app/app/`. Those names do not conflict.

```text
/                      Landing / development entry (not an auto-redirect)
/app                   Overview
/app/goals             Goal list (optional `?status=` filter)
/app/goals/new         Create Goal
/app/goals/[goalId]    Goal detail, edit, progress, status
/app/work
/app/activity
/app/approvals
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
Business-State Services (`@/business-state`)
        ↓
Prisma (`src/prisma/db.ts`)
        ↓
Neon
```

Pages and layouts must not query Prisma directly. Reads go through `@/business-state`. Goal mutations go through Command Center Server Actions, which call business-state services after a server-side write-access check. Organization identity comes from `getJsSolutionsOrganization()` — never from a hardcoded UUID or browser form field.

## Overview (Milestone 2.2)

**Status:** Implemented

`/app` is request-time (`dynamic = 'force-dynamic'`). It does not cache a build-time snapshot of business state. There is no client fetching, polling, or API route for this page.

### Sections

- Organization identity (`name`, `status`, optional description)
- Summary counts: Active Goals, Open Work, Pending Approvals, Active Agents
- Owner Attention (derived)
- Active Goals preview
- Current open WorkItems (up to 5)
- Pending Approvals (up to 5, no approve/reject actions)
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

## Knowledge / documentation

Markdown files under `docs/` remain the canonical source of truth.

The future Knowledge UI renders and navigates that source. It does not create a second documentation database. Milestone 2.1 only establishes the `/app/knowledge` destination.

## Authentication

**Status:** Future

The Command Center is currently unauthenticated development functionality. Do not treat `/app` as private.

## Environment indicator

The sidebar System area shows `Development` or `Production` from `NODE_ENV`. It does not expose hosts, connection strings, or credentials. `next start` therefore labels Production even on a developer machine. That is a known Milestone 2.1 limitation; it is not inferred from the Neon hostname. Do not treat the label as write-access state — writes use the separate `JS_OS_COMMAND_CENTER_WRITES` check above.

## What 2.1–2.3 do not include

- Work, activity, approval, or agent *management* UIs
- Approval or AgentRun actions from Overview
- Documentation renderer / MDX
- Auth
- Tools, agents, orchestration, APIs created for their own sake
- Goal deletion
- Automatic BusinessEvent writes from Goal mutations

## Related

- [Phase 2](../phases/phase-02-command-center.md)
- [Business-state services](business-state-services.md)
- [Architecture overview](overview.md)
