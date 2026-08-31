# Phase 2 — Command Center

**Status:** In progress

Phase 1 business state is complete. Phase 2 makes that state observable and manageable through an internal Command Center. The dashboard reads and coordinates. It does not execute external tools.

## Objective

Give humans a central view of running JS Solutions: what is happening, what needs attention, and what JS OS is doing about it.

## Milestones

```text
2.1 Command Center shell + navigation     Implemented
2.2 Business overview                     Implemented
2.3 Goals                                 Implemented
2.4 Work                                  Implemented
2.5 Activity                              Planned
2.6 Approvals                             Planned
2.7 Agents                                Planned
2.8 Knowledge / documentation browser     Planned
2.9 Integration + polish                  Planned
```

Routes for 2.5–2.8 exist as placeholders. That is not feature completion.

## Milestone 2.1 — Shell + navigation

**Status:** Implemented

- Internal URL namespace `/app`
- Persistent desktop sidebar and mobile navigation from one config
- Page header pattern
- Placeholder screens without fabricated metrics or sample records
- Landing page `/` remains a deliberate entry point (no auto-redirect to `/app`)
- Unauthenticated development; auth is future work

## Milestone 2.2 — Business overview

**Status:** Implemented

- Server-rendered `/app` Overview using `@/business-state` only
- Read-only: no mutations, server actions, or approval/agent controls
- Live organization identity, summary counts, Owner Attention, and section previews
- Owner Attention is a deterministic derived projection, not AI
- Real empty/zero states are shown; no fabricated data

## Milestone 2.3 — Goals

**Status:** Implemented

- Server-rendered `/app/goals`, `/app/goals/new`, `/app/goals/[goalId]`
- Reads through `@/business-state` with `getJsSolutionsOrganization()` scoping
- Mutations via Server Actions → Goal services; no Goal API routes
- Owner can view, create, inspect, edit, update progress, and change status
- No Goal deletion (`CANCELLED` is the terminal cancel path)
- No universal progress percentage (metric direction is not modeled)
- `completedAt` owned by the Goal service, not the UI
- Temporary unauthenticated write safeguard: `NODE_ENV === "development"` and `JS_OS_COMMAND_CENTER_WRITES === "true"`
- Goal mutations do not write BusinessEvents (no atomic mutation+event pattern yet)

## Milestone 2.4 — Work

**Status:** Implemented

- Server-rendered `/app/work`, `/app/work/new`, `/app/work/[workItemId]`
- Reads through `@/business-state` with `getJsSolutionsOrganization()` scoping
- Mutations via Server Actions → WorkItem services; same write-access safeguard as Goals
- Owner can view, filter, create, inspect, edit, change status/priority, assign configured AgentDefinitions, link Goals, set due dates, and set optional parent/child
- No WorkItem deletion (`COMPLETED` / `CANCELLED`)
- `startedAt` / `completedAt` owned by the WorkItem service; `CANCELLED` is not completion
- `WAITING_APPROVAL` does not create an Approval
- Assignment does not start an AgentRun
- Work mutations do not write BusinessEvents

## Remaining work

- 2.5–2.7 feature screens for Activity, Approvals, Agents
- 2.8 Knowledge browser over canonical `docs/` markdown
- 2.9 polish, empty-state quality, and cross-page consistency
- Authentication (replaces the Command Center write safeguard)
- Unified mutation-to-BusinessEvent auditing

Not in Phase 2: tools, agent reasoning, integrations, schema changes.

## Key safety boundary

Read and coordinate. The Command Center does not execute external tools. UI must use `@/business-state`, not raw Prisma. Until auth exists, Command Center writes require explicit local opt-in and remain disabled by default.

## Exit criteria

Owner can see goals, work, approvals, and recent events from live business state. Partially met: Overview is live; Goals and Work can be managed when writes are enabled; dedicated Activity/Approvals/Agents screens are still planned.

## Related

- [Command Center architecture](../architecture/command-center.md)
- [Business-state services](../architecture/business-state-services.md)
- [Roadmap](../roadmap.md)
