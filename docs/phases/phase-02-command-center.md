# Phase 2 — Command Center

**Status:** Complete

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
2.7 Agents                                Implemented
2.8 Knowledge / documentation browser     Implemented
2.9 Integration + polish                  Implemented
```

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
- Mutations via Server Actions → Goal business commands; no Goal API routes
- Owner can view, create, inspect, edit, update progress, and change status
- No Goal deletion (`CANCELLED` is the terminal cancel path)
- No universal progress percentage (metric direction is not modeled)
- `completedAt` owned by the Goal persistence/domain layer, not the UI
- Temporary unauthenticated write safeguard: `NODE_ENV === "development"` and `JS_OS_COMMAND_CENTER_WRITES === "true"`
- Goal mutations record `goal.created` / `goal.updated` / `goal.progress_updated` / `goal.status_changed` through ADR-007 commands

## Milestone 2.4 — Work

**Status:** Implemented

- Server-rendered `/app/work`, `/app/work/new`, `/app/work/[workItemId]`
- Reads through `@/business-state` with `getJsSolutionsOrganization()` scoping
- Mutations via Server Actions → WorkItem business commands; same write-access safeguard as Goals
- Owner can view, filter, create, inspect, edit, change status/priority, assign configured AgentDefinitions, link Goals, set due dates, and set optional parent/child
- No WorkItem deletion (`COMPLETED` / `CANCELLED`)
- `startedAt` / `completedAt` owned by the WorkItem persistence/domain layer; `CANCELLED` is not completion
- `WAITING_APPROVAL` does not create an Approval
- Assignment does not start an AgentRun
- Work mutations record `work.created` / `work.updated` / `work.status_changed` through ADR-007 commands

## Milestone 2.5 — Activity

**Status:** Implemented

- Server-rendered `/app/activity` and `/app/activity/[eventId]`
- Read-only BusinessEvent list and detail; no edit/delete
- Filters: `sourceType`, exact `eventType`; default list limit 50
- Metadata rendered as safe pretty-printed JSON
- Atomic command/event architecture adopted ([ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)); Goal/Work/Approval/Agent owner mutations emit events
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

## Milestone 2.7 — Agents

**Status:** Implemented

- Server-rendered `/app/agents` and `/app/agents/[agentId]`
- Reads through `@/business-state` with `getJsSolutionsOrganization()` scoping
- Owner may change `status` and `permissionLevel` via business commands (AgentDefinition + BusinessEvent in one transaction)
- Identity fields remain bootstrap-managed; no create/delete Agent UI; no AgentRun creation
- `permissionLevel` is a ceiling; EXECUTE does not bypass tools, policy, or approvals
- AgentRun history is inline, bounded, and does not dump `inputSnapshot` / `output`
- Same write-access safeguard as Goals/Work/Approvals
- Overview Active Agents and failed-run attention link to Agent detail; Activity shows configuration events

## Milestone 2.8 — Knowledge

**Status:** Implemented

- Read-only `/app/knowledge` and `/app/knowledge/[...slug]` over canonical `docs/` Markdown
- `src/knowledge/` loader indexes documents for the Command Center and future reuse
- No database, editor, embeddings, or RAG
- Internal `.md` links rewrite to Knowledge routes; unknown slugs 404
- Optional `?q=` substring search over title, section, path, and Markdown text

## Milestone 2.9 — Integration + polish

**Status:** Implemented

- Goal and Work owner mutations migrated onto the ADR-007 command boundary
- Activity shows `goal.*`, `work.*`, `approval.*`, and `agent.*` events from real owner commands
- Overview metrics, Owner Attention order, and detail hrefs reviewed
- Cross-links: Work → Goal / parent Work / configured Agent; Approval → Work / Agent Run context; Activity → event detail
- Shared enum labels (`IN_PROGRESS` → In Progress); organization timezone timestamps; consistent empty/read-only copy
- Footer runtime label does not claim to identify the connected database

## Remaining work (after Phase 2)

- Authentication (replaces the Command Center write safeguard)
- Phase 3 tools + permissions
- Row-level locking / optimistic versioning if concurrent owner edits become a problem

Not in Phase 2: tools, agent reasoning, integrations, schema changes, RAG, scheduling, policy engine.

## Key safety boundary

Read and coordinate. The Command Center does not execute external tools. UI must use `@/business-state` for reads and `src/business-commands/` for consequential writes, not raw Prisma. Until auth exists, Command Center writes require explicit local opt-in and remain disabled by default. Approving an Approval is still not execution. Changing an AgentDefinition does not invoke a model.

## Exit criteria

Owner can see goals, work, approvals, agents, knowledge, and recent events from live business state. Met. Activity records Goal, Work, Approval, and Agent configuration commands. Overview, Activity, and Knowledge remain read-only.

## Related

- [Command Center architecture](../architecture/command-center.md)
- [Business-state services](../architecture/business-state-services.md)
- [Roadmap](../roadmap.md)
