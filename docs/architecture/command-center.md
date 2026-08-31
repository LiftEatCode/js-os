# Command Center

**Status:** In progress. Milestone 2.1 (shell + navigation) is implemented. Later Command Center milestones are planned.

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
| Overview | Current company state and owner attention | 2.2 Planned |
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

Pages and layouts must not query Prisma directly. Milestone 2.1 does not load live Goals, WorkItems, events, approvals, or agent runs. Optional organization display was deferred so the shell stayed focused.

## Knowledge / documentation

Markdown files under `docs/` remain the canonical source of truth.

The future Knowledge UI renders and navigates that source. It does not create a second documentation database. Milestone 2.1 only establishes the `/app/knowledge` destination.

## Authentication

**Status:** Future

The Command Center is currently unauthenticated development functionality. Do not treat `/app` as private.

## Environment indicator

The sidebar System area shows `Development` or `Production` from `NODE_ENV`. It does not expose hosts, connection strings, or credentials.

## What 2.1 does not include

- Live business overview or fake metrics
- Goal, work, activity, approval, or agent feature UIs
- Documentation renderer / MDX
- Auth
- Tools, agents, orchestration, APIs created for their own sake
- Schema or business-state mutations

## Related

- [Phase 2](../phases/phase-02-command-center.md)
- [Business-state services](business-state-services.md)
- [Architecture overview](overview.md)
