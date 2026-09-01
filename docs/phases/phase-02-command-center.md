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
2.5 Activity                              Implemented
2.6 Approvals                             Implemented
2.7 Agents                                Planned
2.8 Knowledge / documentation browser     Planned
2.9 Integration + polish                  Planned
```

Routes for 2.7–2.8 exist as placeholders. That is not feature completion.

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

## Milestone 2.5 — Activity

**Status:** Implemented

- Server-rendered `/app/activity` and `/app/activity/[eventId]`
- Read-only BusinessEvent list and detail; no edit/delete
- Filters: `sourceType`, exact `eventType`; default list limit 50
- Metadata rendered as safe pretty-printed JSON
- Atomic command/event architecture adopted ([ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)); Goal/Work mutations not migrated
- No fake BusinessEvents created to populate the page

## Milestone 2.6 — Approvals

**Status:** Implemented

- Server-rendered `/app/approvals`, `/app/approvals/new`, `/app/approvals/[approvalId]`
- Reads through `@/business-state` with `getJsSolutionsOrganization()` scoping
- Mutations via Server Actions → business commands (Approval + BusinessEvent in one transaction)
- `APPROVED ≠ EXECUTED`: decisions do not call tools, APIs, complete WorkItems, or continue AgentRuns
- Request fields immutable after creation; no deletion
- Rejection requires `decisionReason`; approve/cancel reasons optional
- `expiresAt` may be stored; no expiration worker; past expiration is derived UI copy only
- Manual requester is `USER` with `requestedById` null (no auth)
- Same write-access safeguard as Goals/Work
- Overview pending rows and Owner Attention link to Approval detail; Activity shows the new events

## Remaining work

- 2.7 feature screens for Agents
- 2.8 Knowledge browser over canonical `docs/` markdown
- 2.9 polish, empty-state quality, and cross-page consistency
- Authentication (replaces the Command Center write safeguard)
- Migrate Goal/Work onto atomic BusinessEvent commands

Not in Phase 2: tools, agent reasoning, integrations, schema changes.

## Key safety boundary

Read and coordinate. The Command Center does not execute external tools. UI must use `@/business-state`, not raw Prisma. Until auth exists, Command Center writes require explicit local opt-in and remain disabled by default. Approving an Approval is still not execution.

## Exit criteria

Owner can see goals, work, approvals, and recent events from live business state. Partially met: Overview, Goals, Work, Activity, and Approvals are implemented; dedicated Agents screens remain. Activity now records Approval commands; Goal/Work edits still do not emit events.

## Related

- [Command Center architecture](../architecture/command-center.md)
- [Business-state services](../architecture/business-state-services.md)
- [Roadmap](../roadmap.md)
