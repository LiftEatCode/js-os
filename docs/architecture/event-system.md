# Event system

**Status:** Implemented (model). Emission from app/integrations is future.

BusinessEvent is the auditable timeline JS OS and future agents inspect.

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

No `updatedAt`. No `correlationId` or `causationId` in v0.1.

`eventType` stays a string so new integrations can emit types such as `lead.created` or `audit.completed` without a schema enum migration.

Source types: `SYSTEM` | `USER` | `AGENT` | `JS_GROWTH` | `GITHUB` | `EMAIL` | `CALENDAR` | `PAYMENTS` | `OTHER`.

`occurredAt` is business time. `createdAt` is when JS OS recorded it.

## AgentRun provenance

An AgentRun may conceptually produce BusinessEvents. v0.1 does **not** include `BusinessEvent.agentRunId`. Provenance can use `sourceType` / `sourceId` and/or `metadata` until that is revisited.

## Rules

- Treat as append-only. Do not rewrite history.
- Organization delete is Restrict — events are not cascade-deleted.
- Do not use JSON as a substitute for core typed fields.

## Related

- [Business state](business-state.md)
- [Agent architecture](agent-architecture.md)
