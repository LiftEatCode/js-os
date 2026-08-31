# Business state

**Status:** Implemented (Prisma 8 contract, development bootstrap, service layer). Company Goal *rows* are not populated yet; that is operating-state configuration, not unfinished infrastructure.

JS OS reasons from durable business state, not from chat history. The Phase 1 model is intentionally small.

Canonical authoring file: `src/prisma/contract.prisma`.

## Entities

| Entity | Purpose |
|---|---|
| Organization | Company or operating entity. Not a hardcoded singleton. |
| Goal | Durable objective JS OS should optimize toward. |
| WorkItem | Actionable work. One model for all departments. |
| BusinessEvent | Append-oriented timeline of meaningful occurrences. |
| Approval | Authorization for a proposed action, not execution. |
| AgentDefinition | Configured AI role. Not a run. |
| AgentRun | Audit record of one execution. |

JS Growth product records are not modeled here. Point at them with `sourceType` / `sourceId`.

## Organization

Fields: `id`, `name`, `slug` (unique), `description?`, `timezone` (IANA string, no enum, no hardcoded default), `status`, `createdAt`, `updatedAt`.

Status: `ACTIVE` | `INACTIVE`.

Owns all Phase 1 entities. No billing, address, tax, users, or CRM fields in v0.1. Auth and membership stay outside the model.

Development bootstrap (`npm run db:bootstrap`) writes one organization:

```text
name: JS Solutions
slug: js-solutions
status: ACTIVE
timezone: America/Chicago
```

Development bootstrap (`npm run db:bootstrap`) creates that organization if it is missing. If `js-solutions` already exists, bootstrap leaves mutable fields alone and only verifies identity (expected name `JS Solutions`). It does not continuously enforce operating configuration. Goals are not bootstrapped yet.

## Goal

Fields: `id`, `organizationId`, `title`, `description?`, `status`, `priority`, `timeHorizon`, `targetDate?`, `metricName?`, `metricUnit?`, `targetValue?`, `currentValue?`, `createdAt`, `updatedAt`, `completedAt?`.

- Status: `DRAFT` | `ACTIVE` | `ACHIEVED` | `PAUSED` | `CANCELLED`
- Priority: `GoalPriority` `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` (entity-specific)
- Time horizon: `SHORT_TERM` | `QUARTERLY` | `ANNUAL` | `LONG_TERM`
- Metrics use PostgreSQL `numeric` (`Decimal`). Optional so qualitative goals work.
- No parent/child Goal hierarchy in v0.1.

## WorkItem

The only operational work model. Do not split SalesTask / MarketingTask / EngineeringTask.

Fields: `id`, `organizationId`, `goalId?`, `parentId?`, `agentRunId?`, `title`, `description?`, `status`, `priority`, `workType`, `sourceType?`, `sourceId?`, `assignedAgentId?`, `dueAt?`, `startedAt?`, `completedAt?`, `createdAt`, `updatedAt`.

- Status: `BACKLOG` | `READY` | `IN_PROGRESS` | `BLOCKED` | `WAITING_APPROVAL` | `COMPLETED` | `CANCELLED`
- Priority: `WorkItemPriority` (entity-specific)
- Work type: `TASK` | `REVIEW` | `RESEARCH` | `CONTENT` | `OUTREACH` | `ENGINEERING` | `CLIENT_WORK` | `ADMIN` | `DECISION`
- Self-relation: named `WorkItemHierarchy` (`parent` / `children`)
- No JSON metadata

### Internal vs external origin

Internal provenance uses foreign keys:

```text
organizationId
goalId
parentId
agentRunId      — AgentRun that created the WorkItem
assignedAgentId — AgentDefinition assigned to the work
```

External/integration origin only:

```text
sourceType?  WorkItemSourceType: JS_GROWTH | GITHUB | EMAIL | CALENDAR | PAYMENTS | OTHER
sourceId?
```

Do not store JS OS record IDs in `sourceId`.

## BusinessEvent

See [event system](event-system.md).

## Approval

See [approval system](approval-system.md).

## AgentDefinition and AgentRun

See [agent architecture](agent-architecture.md).

## Locked v0.1 decisions

- One Organization entity, not a singleton assumption
- One WorkItem model across departments
- JS Growth remains canonical for product-specific sales data
- Approval is authorization, not execution; `payload` instead of ProposedAction
- `AgentDefinition.permissionLevel` is a ceiling
- AgentRun is an audit record, not chat history
- BusinessEvent is append-only in concept; `eventType` is a string
- JSON limited to four fields: `BusinessEvent.metadata`, `Approval.payload`, `AgentRun.inputSnapshot`, `AgentRun.output`
- Internal provenance uses FKs
- WorkItem `sourceType` / `sourceId` are external only
- No Goal hierarchy
- No auth/org membership
- Entity-specific enums even when labels match
- UUID primary keys (`Uuid @default(uuid())`)
- No BusinessEvent `agentRunId` in v0.1

## Referential integrity

No Cascade in v0.1.

**Restrict** (history cannot be silently dropped):

- Every `organizationId`
- `AgentRun.agentDefinitionId`
- `WorkItem.agentRunId` (creating run)
- `Approval.agentRunId`

If an AgentRun is referenced as creator/source of a WorkItem or Approval, it cannot be deleted until that relationship is explicitly handled. The FK fields remain optional because records may originate without a run.

**SetNull** (optional operational links):

- `WorkItem.goalId`
- `WorkItem.parentId`
- `WorkItem.assignedAgentId`
- `Approval.workItemId`

## JSON and naming

See [database](database.md). Naming: PascalCase models, camelCase fields, SCREAMING_SNAKE_CASE enums, `*At` timestamps, lowercase-dot `eventType` values at runtime.

Application access: [business-state services](business-state-services.md).

## Remaining work after Phase 1

- Deliberate Goal rows (operating-state population, not schema)

## Related

- [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md)
- [Business-state services](business-state-services.md)
- [Phase 1](../phases/phase-01-business-state.md)
