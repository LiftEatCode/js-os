# ADR-007: Atomic business mutation and event recording

## Status
Accepted

## Context

Command Center Goal (2.3) and Work (2.4) mutations persist business-state rows without writing BusinessEvents. That gap was intentional: sequential

```text
write entity
then write event
```

can leave `entity write succeeds` / `event write fails`, which is incomplete and misleading operational history.

Activity (2.5) now reads BusinessEvents. The Prisma 8 PostgreSQL client used by JS OS (`src/prisma/db.ts`) supports `db.transaction(async (tx) => …)`. The callback commits on return and rolls back on throw. The transaction handle exposes `tx.orm`, matching the persistence API used by business-state services.

Existing services call the global `db` client. Calling `createGoal()` then `recordBusinessEvent()` inside a transaction would still not be atomic, because those functions do not use `tx`.

## Decision

1. Consequential JS OS business mutations that should appear in operational history must eventually execute through an application **command** boundary that atomically commits the state change and its BusinessEvent in one PostgreSQL transaction.
2. That boundary lives in `src/business-commands/` (`runBusinessCommand` / `commitStateAndEvent`). It sits above `@/business-state`. It must not depend on Command Center routes, forms, redirects, or revalidation.
3. Command implementations must write through the transaction handle (`tx.orm`), not the global `db`.
4. Raw business-state services remain lower-level primitives. They do not automatically emit events.
5. Command Center, future agents, schedules, and integrations should call commands for consequential mutation paths once those commands exist.
6. Goal and Work Command Center mutations are **not** migrated in this decision’s first implementation. Migrating them is a follow-on change so 2.3/2.4 stay stable.

### Exceptions

- Foundational/bootstrap operations may omit BusinessEvents.
- Pure reads do not create events.
- Not every low-level persistence function emits events.

## Consequences

- Operational history can become reliable: no partial state/event success.
- An extra application layer exists (`src/business-commands/`).
- Future commands must define `eventType`, human-readable title, and small metadata (IDs and deltas — not full row dumps).
- Until Goal/Work commands exist, Activity may correctly omit those owner mutations.
- Approval Command Center mutations (Milestone 2.6) are the first production use of this boundary: `requestApprovalCommand` / `approveApprovalCommand` / `rejectApprovalCommand` / `cancelApprovalCommand` write through `tx.orm` and append `approval.requested` / `approved` / `rejected` / `cancelled` in the same transaction.
- BusinessEvent remains operational event history, not a complete security audit log.

## Alternatives considered

- Best-effort sequential event writes after Goal/Work actions: rejected; partial success is worse than an empty timeline.
- Make `createGoal()` / `updateWorkItem()` always emit events: rejected; couples persistence to event policy and still needs a transaction-scoped client.
- Defer the command boundary until Prisma transactions are “proven in production”: rejected; the installed Prisma 8 PostgreSQL API already provides `db.transaction`.
