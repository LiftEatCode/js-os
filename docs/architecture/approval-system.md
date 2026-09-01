# Approval system

**Status:** Implemented (model, persistence, Command Center, atomic commands). Tool execution, expiration workers, and automatic WorkItem coupling are future.

An Approval is authorization for a proposed action. It is not the action itself.

```text
APPROVED ≠ EXECUTED
```

Approving records that the owner authorized the proposal. It does **not** mean a tool ran, an API was called, email was sent, content was published, an AgentRun continued, or a WorkItem completed.

Future phases decide whether and how approved actions are executed.

## Why it exists

AI may recommend and prepare. JS OS decides what may run. Sensitive actions need a human decision: outbound communications, publishing, spend, production deploys, refunds.

## Shape

```text
id
organizationId
workItemId?
agentRunId?
actionType          String (not an enum)
title
description?
status
riskLevel
requestedByType
requestedById?      opaque until auth exists
requestedAt
decidedAt?
decisionReason?
expiresAt?
payload?            Jsonb — the proposed action
createdAt
updatedAt
```

- Status: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED` | `EXPIRED`
- Risk: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` (entity-specific)
- Requester: `USER` | `AGENT` | `SYSTEM`

No ProposedAction entity in v0.1. `payload` holds the proposed action.

## Integrity

- Organization delete: Restrict
- `agentRunId`: Restrict (optional field; if set, the run cannot be deleted)
- `workItemId`: SetNull

Approvals remain durable. There is no delete/remove API. Use status transitions.

## Lifecycle

```text
PENDING
  ├── APPROVED
  ├── REJECTED
  └── CANCELLED
```

Terminal: `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`. Once terminal, owner decision actions are unavailable.

`EXPIRED` exists on the persisted enum. There is **no** scheduler or worker that transitions `PENDING` rows to `EXPIRED`. A pending request whose `expiresAt` is in the past is still `PENDING`. The UI may show **Past expiration time** as derived information. Reads never mutate status. There is no manual EXPIRED transition in the service API.

## `decidedAt` and `decisionReason`

Owned by domain logic, not the UI.

- Entering `APPROVED`, `REJECTED`, or `CANCELLED` sets `decidedAt` to command time. Cancellation is a final disposition.
- Rejection requires a non-empty `decisionReason`.
- Approval and cancellation reasons are optional.
- One final `decisionReason` field is enough. There is no comment thread.

This tightens the Phase 1 `rejectApproval` helper: a rejection without a reason is now invalid. Approve/cancel still allow an omitted reason.

## Proposal immutability

An Approval authorizes a **particular** proposed action. If title, `actionType`, risk, payload, or linked work changed after approval, authorization would be ambiguous.

```text
request created
    ↓
proposal frozen
    ↓
owner decides
```

Request fields are immutable after creation. Only decision state changes afterward. A different proposal requires a new Approval. This is an Approval-domain invariant, not a separate ADR.

## `actionType`

`actionType` must be `lowercase.dot.notation` (for example `outreach.send_email`). Segments may include underscores. There is no universal action taxonomy yet. Command Center and `createApprovalRequest` validate this format. Max length 120.

## Payload

`payload` describes the proposed action. Command Center renders it as pretty-printed JSON in a `<pre>` block. HTML is never interpreted. Null shows “No action payload recorded.”

Manual creation accepts a textarea: empty → `null`; valid JSON → stored value; invalid JSON → form error. JSON only. Nothing is evaluated.

BusinessEvent metadata must **not** include the full payload, description, credentials, secrets, prompts, or chain-of-thought.

## WorkItem and AgentRun linkage

Optional `workItemId` is context only. Creating an Approval does **not** set the WorkItem to `WAITING_APPROVAL`.

```text
WorkItem.status = WAITING_APPROVAL
```

means execution work is waiting on authorization.

```text
Approval.status = PENDING
```

means an authorization request exists.

They are related concepts and are **not** synchronized in Phase 2. Future commands may atomically create an Approval and move a WorkItem to `WAITING_APPROVAL`. That is outside this milestone.

Optional `agentRunId` is displayed on detail when present. The manual owner form does **not** select an AgentRun (that would invent provenance). Future agent commands should set it truthfully. There is no `/app/agent-runs/[id]` route; AgentRun history is inline on Agent detail (Milestone 2.7).

## Requester (unauthenticated Command Center)

Manual owner-created requests use `requestedByType = USER` and `requestedById = null`. Authentication does not exist, so JS OS does not fabricate a user UUID. The form cannot impersonate `AGENT` or `SYSTEM`. Future agent/system commands will set the real requester type.

## Command Center

Routes:

```text
/app/approvals
/app/approvals/new
/app/approvals/[approvalId]
```

Reads go through `@/business-state` and `getJsSolutionsOrganization()`. Other-organization IDs are not found. There are no `/approve`, `/reject`, or `/cancel` routes.

List: pending first, then risk `CRITICAL` → `LOW`, then oldest `requestedAt`. Terminal records follow, most recently decided. Filters (GET, combinable; unknown values ignored): `status`, `riskLevel`, `requestedByType`. Risk is shown as text, not color-only.

Detail shows the full request, payload, related WorkItem (link to `/app/work/[id]` when present), related AgentRun (read-only), and decision fields. PENDING + writes enabled: Approve / Reject / Cancel POST forms. CRITICAL decisions require an explicit confirmation checkbox, validated server-side. Writes disabled: read-only notice, no decision controls.

The same write safeguard as Goals/Work applies: `NODE_ENV === "development"` and `JS_OS_COMMAND_CENTER_WRITES === "true"`. There is no Approval-specific flag.

## Business commands (ADR-007)

Approvals are the first production feature on the atomic command boundary.

```text
Browser form
    ↓
Server Action
    ↓
write-access check
    ↓
parse / validate
    ↓
JS Solutions organization + related entities
    ↓
Business Command (`src/business-commands/`)
    ↓
single database transaction
       ├── mutate Approval (`tx.orm`)
       └── append BusinessEvent (`tx.orm`)
    ↓
commit / rollback atomically
    ↓
revalidate `/app`, `/app/activity`, `/app/approvals`, `/app/approvals/[id]`
```

Commands: `requestApprovalCommand`, `approveApprovalCommand`, `rejectApprovalCommand`, `cancelApprovalCommand`.

Shared Approval lifecycle/persistence (`createApprovalRequestWithOrm`, `applyApprovalDecisionWithOrm`) accepts the ORM surface. Global services pass `db.orm`. Commands pass `tx.orm`. Domain rules are not duplicated.

Do not call `createApprovalRequest()` then `recordBusinessEvent()` against global `db` for these paths. That is not atomic.

## Events

| Mutation | eventType | Meaning |
|---|---|---|
| request | `approval.requested` | An authorization request exists |
| approve | `approval.approved` | Owner authorized the proposal. Not execution. |
| reject | `approval.rejected` | Owner denied the request |
| cancel | `approval.cancelled` | Request withdrawn; not a denial |

Titles: `Approval requested`, `Approval approved`, `Approval rejected`, `Approval cancelled`.

Command Center actions use `sourceType = USER` and `sourceId = null`. `occurredAt` is command time, never browser input.

Request metadata: `approvalId`, `actionType`, `riskLevel`, optional `workItemId`. Decision metadata: `approvalId`, `riskLevel`, optional `workItemId`. Optional IDs only when present.

`approval.expired` is not implemented (no expiration worker).

## Duplicate decisions and concurrency

Decision commands load the Approval **inside** the same transaction, verify `PENDING`, then mutate and append the event. A second approve of an already `APPROVED` row is an invalid transition and does not append another `approval.approved` event.

JS OS does not yet use row-level locks or a version column. A true concurrent double-decision race remains a residual v0.1 limitation.

## Public business-state services

`createApprovalRequest`, `approveApproval`, `rejectApproval`, `cancelApproval`, list/get helpers remain. They now share transaction-capable persistence. They still do **not** emit BusinessEvents on their own (commands do).

Intentional tightenings vs the original Phase 1 helpers:

- `actionType` must be `lowercase.dot.notation`
- rejection requires `decisionReason`

## Not in 2.6

Tool execution, external API calls, agent continuation, automatic WorkItem completion, automatic Approval creation from `WAITING_APPROVAL`, approval chains, multiple approvers, RBAC, delegated approval, scheduled expiration, notifications, queues, background jobs, deletion, or editing a proposal after creation.

See [approval policy](../policies/approvals.md), [risk policy](../policies/risk.md), [event system](event-system.md), [ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md), and [business-state services](business-state-services.md).
