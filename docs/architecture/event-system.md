# Event system

**Status:** Implemented (model + append-only service + Command Center Activity). Goal, Work, Approval, and Agent Command Center mutations emit events atomically. Emission from integrations and AgentRuns is future.

BusinessEvent is the operational timeline JS OS and future agents inspect. It is not chat history.

## Purpose

Record something meaningful that happened in or around the business: a lead created, an audit completed, a client signed, a deployment failed, a work item completed, an approval rejected.

## Shape

```text
id
organizationId
eventType          String  (not an enum)
sourceType         BusinessEventSourceType
sourceId?
title
description?
occurredAt
metadata?          Jsonb
createdAt
```

No `updatedAt`. No `correlationId` or `causationId` in v0.1. There is no generic “affected entity” field.

`eventType` stays a string so new integrations can emit types such as `lead.created` or `audit.completed` without a schema enum migration.

Source types: `SYSTEM` | `USER` | `AGENT` | `JS_GROWTH` | `GITHUB` | `EMAIL` | `CALENDAR` | `PAYMENTS` | `OTHER`.

The source enum is a vocabulary, not a claim that those integrations exist. `sourceId` identifies the source, not automatically a Goal or WorkItem.

`occurredAt` is business time. `createdAt` is when JS OS recorded it.

Titles should be human-readable and self-contained (for example `Goal created`). Description adds context. Activity should not have to reconstruct titles from metadata.

## Naming convention

`eventType` must be `lowercase.dot.notation` at the service boundary.

Recommended structure: `<domain>.<action>`.

Documentation examples only (not seeded rows):

```text
goal.created
goal.updated
goal.status_changed
goal.progress_updated

work.created
work.updated
work.status_changed

approval.requested
approval.approved
approval.rejected
approval.cancelled

agent.status_changed
agent.permission_changed

agent.run.started
agent.run.completed
agent.run.failed
```

Do not turn `eventType` into a schema enum.

## Metadata policy

Use `metadata` for event-specific context only. Prefer IDs and small deltas:

```json
{
  "goalId": "...",
  "previousStatus": "DRAFT",
  "newStatus": "ACTIVE"
}
```

Agent configuration events use the same policy:

```json
{
  "agentDefinitionId": "...",
  "agentSlug": "marketing",
  "previousStatus": "ACTIVE",
  "newStatus": "PAUSED"
}
```

```json
{
  "agentDefinitionId": "...",
  "agentSlug": "sales",
  "previousPermissionLevel": "RECOMMEND",
  "newPermissionLevel": "PREPARE"
}
```

Do not dump entire Goal/WorkItem/AgentDefinition rows, credentials, sensitive email bodies, raw LLM prompts, or hidden chain-of-thought.

## Operational history vs security audit

BusinessEvent is **operational event history**. It is not a complete security audit log. Future high-assurance audit needs may require additional provenance or a dedicated mechanism. v0.1 does not claim that coverage.

For normal business-state mutation history, atomic state+event recording is the preferred architecture ([ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)).

## AgentRun provenance

An AgentRun may conceptually produce BusinessEvents. v0.1 does **not** include `BusinessEvent.agentRunId`. Provenance can use `sourceType` / `sourceId` and/or `metadata` until that is revisited.

## Rules

- Treat as append-only. Do not rewrite history.
- The service layer exposes `recordBusinessEvent` / list / get. It does not expose update or delete.
- Command Center Activity is read-only. It does not author events.
- Organization delete is Restrict — events are not cascade-deleted.
- Do not use JSON as a substitute for core typed fields.
- `eventType` at the service boundary must be `lowercase.dot.notation`.

## Command Center Activity

`/app/activity` and `/app/activity/[eventId]` list and inspect events for the JS Solutions Organization. List default limit is 50. Filters: `sourceType`, exact `eventType`.

BusinessEvent is **operational history**. It is not a complete security audit log, chat history, hidden reasoning, or a store of full object snapshots. Activity itself is read-only and does not author events. Knowledge is filesystem-based and does not emit BusinessEvents. Overview is read-only.

### Phase 2 mutation / event coverage

| Area | Owner mutations? | Command boundary? | BusinessEvent? |
|---|---|---|---|
| Goals | Yes | Yes | Yes |
| Work | Yes | Yes | Yes |
| Activity | No | N/A | N/A |
| Approvals | Yes | Yes | Yes |
| Agents | Yes | Yes | Yes |
| Knowledge | No | N/A | N/A |
| Overview | No | N/A | N/A |

Command Center owner actions use `sourceType = USER` and `sourceId = null`.

### Goal and Work event policy

One BusinessEvent per owner action. Do not emit multiple redundant events for one form submission.

| Action | Event |
|---|---|
| Create Goal | `goal.created` |
| Progress-only form | `goal.progress_updated` |
| Status is the only meaningful change | `goal.status_changed` |
| Other field edits, including mixed status + fields | `goal.updated` |
| Create Work Item | `work.created` |
| Status is the only meaningful change | `work.status_changed` |
| Other field edits, including mixed status + fields | `work.updated` |

No-op updates (no meaningful state change) return `InvalidBusinessStateInputError` and write no `*_changed` event.

Metadata is small: IDs, titles, status/priority/workType, and previous/new deltas. No full row dumps, descriptions, or source payloads.

Commands load current state **inside** the transaction before calculating deltas. There is no row locking or version column in Phase 2; concurrent owner edits can last-write-win.

Goal/Work Server Actions call business commands. They do not call a public mutation service followed by `recordBusinessEvent()`.

## Related

- [ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)
- [Business-state services](business-state-services.md)
- [Business state](business-state.md)
- [Command Center](command-center.md)
- [Agent architecture](agent-architecture.md)
