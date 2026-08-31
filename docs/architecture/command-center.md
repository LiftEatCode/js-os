# Command Center

**Status:** In progress. Milestone 2.1 (shell + navigation) and Milestone 2.2 (business overview) are implemented. Later Command Center milestones are planned.

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
| Goals | Strategic objectives and measurable progress | 2.3 Planned |
| Work | WorkItems across JS Solutions | 2.4 Planned |
| Activity | BusinessEvent operational history | 2.5 Planned |
| Approvals | Human decision / authorization queue | 2.6 Planned |
| Agents | Organizational AgentDefinitions and later activity | 2.7 Planned |
| Knowledge | Internal documentation browser | 2.8 Planned |

Routes and navigation exist for all seven areas. Route placeholders are **not** feature completion.

## Route structure

URL namespace: `/app`.

The Next.js App Router lives in `src/app/`. The Command Center URL `/app` is the nested segment `src/app/app/`. Those names do not conflict.

```text
/                 Landing / development entry (not an auto-redirect)
/app              Overview
/app/goals
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

Pages and layouts must not query Prisma directly. Milestone 2.2 Overview is a server-rendered, read-only page that loads live state through `@/business-state`.

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

Instants are formatted in the Organization timezone (`America/Chicago` for JS Solutions) using Temporal, not a separate date library.

## Knowledge / documentation

Markdown files under `docs/` remain the canonical source of truth.

The future Knowledge UI renders and navigates that source. It does not create a second documentation database. Milestone 2.1 only establishes the `/app/knowledge` destination.

## Authentication

**Status:** Future

The Command Center is currently unauthenticated development functionality. Do not treat `/app` as private.

## Environment indicator

The sidebar System area shows `Development` or `Production` from `NODE_ENV`. It does not expose hosts, connection strings, or credentials.

## What 2.1–2.2 do not include

- Goal, work, activity, approval, or agent *management* UIs
- Approval or AgentRun actions from Overview
- Documentation renderer / MDX
- Auth
- Tools, agents, orchestration, APIs created for their own sake
- Schema or business-state mutations from the Command Center

## Related

- [Phase 2](../phases/phase-02-command-center.md)
- [Business-state services](business-state-services.md)
- [Architecture overview](overview.md)
