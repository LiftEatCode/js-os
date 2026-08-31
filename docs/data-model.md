# JS OS Data Model

## Purpose

This document defines the initial domain model for JS OS Phase 1.

The model is intentionally small. It should support durable business state, goals, work coordination, approvals, business events, and future agent execution without prematurely modeling every department or integration.

This is a design document only. It is not a Prisma schema, database migration, or API contract. Implementation should wait until this model is reviewed.

JS OS owns durable internal operating state. JS Growth remains the source of truth for product-specific commercial systems such as Website Growth Audit, GBP Audit, prospects, campaigns, outreach workflows, opportunities, and competitive intelligence. JS OS should reference those records, not duplicate them.

---

## 1. Organization

Represents the company or operating entity controlled by JS OS.

For v0.1, JS Solutions will likely be the only organization. The model should still treat Organization as a first-class entity rather than a hardcoded singleton.

### Fields

```text
id
name
slug
description?
timezone
status
createdAt
updatedAt
```

### Status

```text
ACTIVE
INACTIVE
```

### Relationships

```text
Organization
  has many Goals
  has many WorkItems
  has many BusinessEvents
  has many Approvals
  has many AgentDefinitions
  has many AgentRuns
```

### Notes

- Do not add billing, address, tax, users, or CRM fields yet.
- `timezone` exists because scheduled operations and business events will eventually depend on local business time.
- Auth, membership, and employee records remain outside this model until authentication is implemented.

---

## 2. Goal

Represents a durable business objective JS OS should optimize toward.

Examples:

```text
Reach $25,000 monthly recurring revenue
Sign 3 new web/SEO clients this quarter
Launch GBP Audit V1
Reduce overdue client work to zero
```

### Fields

```text
id
organizationId
title
description?
status
priority
timeHorizon
targetDate?
metricName?
metricUnit?
targetValue?
currentValue?
createdAt
updatedAt
completedAt?
```

### Status

```text
DRAFT
ACTIVE
ACHIEVED
PAUSED
CANCELLED
```

### Priority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

This is a Goal-specific enum (`GoalPriority`), not a shared priority type. Member names may match WorkItem priority today; they remain separate so either can diverge later.

### Time horizon

```text
SHORT_TERM
QUARTERLY
ANNUAL
LONG_TERM
```

### Relationships

```text
Organization 1 -> many Goals
Goal 1 -> many WorkItems
```

### Design notes

Do not create a complex KPI system yet.

The metric fields are optional so simple qualitative goals and measurable goals can share the same model. A goal may exist with only a title and time horizon.

Goals are a flat list in v0.1. There is no parent/child Goal hierarchy. `timeHorizon` is the only grouping dimension.

---

## 3. WorkItem

Represents actionable work that needs to be completed.

This is the main unit of operational work inside JS OS.

Examples:

```text
Review 10 new prospects
Draft September SEO content plan
Fix client contact form
Approve campaign copy
Prepare Copper Secure launch checklist
```

### Fields

```text
id
organizationId
goalId?
parentId?
agentRunId?
title
description?
status
priority
workType
sourceType
sourceId?
assignedAgentId?
dueAt?
startedAt?
completedAt?
createdAt
updatedAt
```

### Status

```text
BACKLOG
READY
IN_PROGRESS
BLOCKED
WAITING_APPROVAL
COMPLETED
CANCELLED
```

### Priority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

This is a WorkItem-specific enum (`WorkItemPriority`), not a shared priority type. Member names may match Goal priority today; they remain separate so either can diverge later.

### Work type

```text
TASK
REVIEW
RESEARCH
CONTENT
OUTREACH
ENGINEERING
CLIENT_WORK
ADMIN
DECISION
```

### Source type

```text
MANUAL
GOAL
AGENT
BUSINESS_EVENT
INTEGRATION
```

`sourceType` may still classify origin (`MANUAL`, `GOAL`, `AGENT`, and so on). When the origin is a JS OS record, the ID belongs on a dedicated foreign key, not in `sourceId`. `sourceId` is for external or integration-origin identifiers.

### Relationships

```text
Organization 1 -> many WorkItems
Goal 1 -> many WorkItems
WorkItem may have one parent WorkItem
WorkItem may have many child WorkItems
AgentRun 0..1 -> many WorkItems
AgentDefinition may be assigned many WorkItems
```

### Foreign keys vs source references

Core JS OS relationships use dedicated foreign keys:

- `organizationId` — owning Organization
- `goalId` — Goal this work supports, if any
- `parentId` — parent WorkItem, if any
- `agentRunId` — AgentRun that directly created this WorkItem, if any
- `assignedAgentId` — AgentDefinition responsible for the work, if any

`assignedAgentId` is optional; many work items will be human-owned.

`agentRunId` is only for a JS OS AgentRun that created the WorkItem. It is not the assigned agent, and it is not an external reference.

`sourceType` and `sourceId` are for external or integration-origin references, such as a JS Growth prospect or a GitHub issue. They are not a substitute for core JS OS foreign keys. Do not store `Goal.id`, `WorkItem.id`, `AgentRun.id`, `AgentDefinition.id`, or other JS OS record IDs in `sourceId`.

WorkItem has no JSON metadata field in v0.1.

### Design rule

Do not create separate task models for SalesTask, MarketingTask, EngineeringTask, or similar.

Use one general WorkItem model for v0.1. Department-specific detail can be added later through integrations or `workType`.

---

## 4. BusinessEvent

Represents something meaningful that happened in or around the business.

Business events create an auditable timeline that future decision logic and agents can inspect. They are append-only: records should not be rewritten after creation.

Examples:

```text
New lead created
Audit completed
Client signed
Invoice paid
Client requested change
Deployment failed
Goal achieved
Work item completed
Approval rejected
```

### Fields

```text
id
organizationId
eventType
sourceType
sourceId?
title
description?
occurredAt
metadata?
createdAt
```

There is no `updatedAt`. BusinessEvent is an immutable timeline record.

`occurredAt` is the business time of the event. `createdAt` is when JS OS recorded it.

v0.1 does not include causation or correlation IDs. `sourceType` / `sourceId` plus timestamps are enough until workflow tracing is required.

### Source type

```text
SYSTEM
USER
AGENT
JS_GROWTH
GITHUB
EMAIL
CALENDAR
PAYMENTS
OTHER
```

### Event type

`eventType` should initially be a string rather than a large enum.

Examples:

```text
lead.created
audit.completed
client.signed
work_item.completed
approval.rejected
deployment.failed
```

This allows new integrations to emit events without a database enum migration for every new event type.

`metadata` should eventually map to JSON in the database. Do not implement the database yet.

---

## 5. Approval

Represents a proposed action that requires explicit human approval before execution.

An Approval is not the action itself. It is authorization for a proposed action. Later execution tooling will consume approved records. This model does not execute anything.

Examples:

```text
Send prospect email
Publish social post
Deploy production code
Issue refund
Approve paid advertising spend
Send client-facing report
```

This matches the JS OS core principle: AI may recommend and prepare actions, but JS OS controls what is permitted to execute.

### Fields

```text
id
organizationId
workItemId?
agentRunId?
actionType
title
description?
status
riskLevel
requestedByType
requestedById?
requestedAt
decidedAt?
decisionReason?
expiresAt?
payload?
createdAt
updatedAt
```

### Status

```text
PENDING
APPROVED
REJECTED
CANCELLED
EXPIRED
```

### Risk level

```text
LOW
MEDIUM
HIGH
CRITICAL
```

This is an Approval-specific enum (`ApprovalRiskLevel`), not a shared severity type. Member names may match Goal or WorkItem priority today; they remain separate.

### Requester type

```text
USER
AGENT
SYSTEM
```

### Relationships

```text
Organization 1 -> many Approvals
WorkItem 0..1 -> many Approvals
AgentRun 0..1 -> many Approvals
```

`payload` should eventually map to JSON. It holds the proposed action details needed for a human to decide and for later execution tooling to run the action if approved.

v0.1 does not introduce a ProposedAction entity. `Approval.payload` is the proposed action. Extract a dedicated entity later only if execution tooling needs a lifecycle independent of the approval decision.

---

## 6. AgentDefinition

Represents a configured AI role inside JS OS.

This entity describes the agent itself, not a specific execution.

Examples:

```text
CEO
Sales
Marketing
Client Operations
Engineering
Finance
```

### Fields

```text
id
organizationId
name
slug
description?
status
role
permissionLevel
instructions?
createdAt
updatedAt
```

### Status

```text
ACTIVE
PAUSED
DISABLED
```

### Role

```text
CEO
SALES
MARKETING
CLIENT_OPERATIONS
ENGINEERING
FINANCE
GENERAL
```

### Permission level

```text
OBSERVE
RECOMMEND
PREPARE
EXECUTE
```

These values match the architecture permission ladder: observe, recommend, prepare, execute.

### Architecture rule

`permissionLevel` is the maximum autonomy the agent may receive.

It does not automatically authorize individual tools. Future tools must still define their own permission and approval requirements.

AgentDefinition does not store tools, credentials, chat history, or memory. Those are out of scope for Phase 1.

---

## 7. AgentRun

Represents one execution of an AgentDefinition.

Every meaningful agent execution should eventually create an AgentRun record. AgentRun is the authoritative audit record. Chat history is not.

Examples:

```text
CEO morning review
Sales prospect prioritization
Marketing weekly planning
Engineering repository review
```

### Fields

```text
id
organizationId
agentDefinitionId
triggerType
triggerReference?
status
startedAt
completedAt?
inputSnapshot?
output?
error?
createdAt
```

There is no `updatedAt` in v0.1. Status still changes over the run lifetime (`QUEUED` → `RUNNING` → `COMPLETED` / `FAILED` / `CANCELLED`). Whether that warrants `updatedAt` can be decided at schema implementation.

### Trigger type

```text
MANUAL
SCHEDULED
BUSINESS_EVENT
WORK_ITEM
SYSTEM
```

### Status

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

### Relationships

```text
AgentDefinition 1 -> many AgentRuns
AgentRun may produce many Approvals
AgentRun 0..1 -> many WorkItems via WorkItem.agentRunId
AgentRun may produce BusinessEvents
```

`inputSnapshot` should capture the relevant business state the run inspected. `output` should capture the result. Together they support the architecture requirement that future agent runs record trigger, input state, result, errors, and timestamps.

Tool request and tool execution history are not modeled yet. They belong with future tool-execution records, not as a replacement for AgentRun.

---

## Relationship overview

```text
Organization
│
├── Goals
│    └── WorkItems
│
├── WorkItems
│    ├── child WorkItems
│    ├── Approval requests
│    ├── optional creating AgentRun (agentRunId)
│    └── optional assigned AgentDefinition
│
├── BusinessEvents
│
├── Approvals
│    └── optional AgentRun
│
├── AgentDefinitions
│    └── AgentRuns
│         ├── WorkItems
│         ├── Approvals
│         └── BusinessEvents
│
└── future Integrations
     ├── JS Growth
     ├── GitHub
     ├── Gmail
     ├── Calendar
     ├── payments
     └── other systems
```

Core flow aligned with the architecture:

```text
Goals
  ↓
Business State
  ↓
Work Items
  ↓
Approvals
  ↓
Execution (future)
  ↓
Business Events
  ↓
Updated Business State
```

---

## Cross-system references

JS OS will eventually need to reference records that live in other systems.

For v0.1, prefer simple external references:

```text
sourceType
sourceId
```

or, where a dedicated pair is clearer:

```text
externalSystem
externalId
```

These pairs are for external or integration-origin records only. Core JS OS relationships use dedicated foreign keys such as `organizationId`, `goalId`, `parentId`, `agentRunId`, `assignedAgentId`, `workItemId`, and `agentDefinitionId`. Do not store those IDs in `sourceId`.

Do not duplicate entire external records.

Example: a JS Growth prospect may eventually appear in JS OS as:

```text
sourceType = "JS_GROWTH"
sourceId = "<prospect-id>"
```

The canonical prospect data remains in JS Growth. JS OS may create WorkItems, Approvals, or BusinessEvents that point at that prospect without copying the prospect model.

The same pattern applies to GitHub issues, payments, calendar events, and other integrations.

---

## JSON / flexible fields

The following fields are intentional candidates for JSON database columns later:

```text
BusinessEvent.metadata
Approval.payload
AgentRun.inputSnapshot
AgentRun.output
```

JSON is appropriate here because these records need to preserve historical payloads from multiple systems and agent types. The exact shape will vary by source and will often need to be stored as-is for audit.

Do not use JSON as a substitute for clearly modeled core business fields such as Goal status, WorkItem priority, or Approval risk level.

WorkItem has no JSON metadata field in v0.1. Typed fields plus `sourceType` / `sourceId` (for external references) and dedicated foreign keys (for JS OS relationships) are the v0.1 surface.

---

## Out of scope for Phase 1

The following are not part of the initial model:

```text
users/authentication
employees
contacts
prospects
leads
clients
invoices
payments
campaigns
email messages
social posts
websites
projects
departments
subscriptions
API credentials
agent tools
tool executions
vector databases
embeddings
chat history
memory systems
workflow graphs
schedules
queues
workers
```

Some of these may be introduced later in JS OS. Others belong to JS Growth or external integrations and should remain there.

---

## Naming conventions

```text
Database/model names: PascalCase
TypeScript properties: camelCase
Enum members: SCREAMING_SNAKE_CASE
Event types: lowercase dot notation
Database timestamps: *At suffix
External IDs: sourceId / externalId
```

Examples:

```text
WorkItem
AgentDefinition
WAITING_APPROVAL
client.signed
audit.completed
createdAt
completedAt
```

Optional fields are marked with `?` in this document. That means the property may be null or omitted, not that a second parallel model exists.

---

## v0.1 Design Decisions

The following were resolved for v0.1. They are constraints on the model above, not open questions.

### 1. Entity-specific enums for priority and risk level

Use entity-specific enums even when members currently match:

```text
GoalPriority
WorkItemPriority
ApprovalRiskLevel
```

Shared enums would couple unrelated concepts. Labels may stay the same for humans (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 2. Direct `agentRunId` on WorkItem

WorkItem has an optional `agentRunId` for the JS OS AgentRun that directly created the WorkItem.

`sourceType` / `sourceId` remain for external or integration-origin references. They are not a substitute for core JS OS foreign keys (`organizationId`, `goalId`, `parentId`, `agentRunId`, `assignedAgentId`).

### 3. No BusinessEvent causation/correlation IDs

Defer causation and correlation IDs until workflow tracing is required. v0.1 uses `sourceType` / `sourceId` and timestamps.

### 4. No WorkItem JSON metadata

Do not add a WorkItem metadata JSON field in v0.1.

### 5. No Goal parent/child hierarchy

Goals are flat in v0.1. `timeHorizon` covers annual vs quarterly vs short-term framing.

### 6. Membership and auth stay outside the domain model

Organization is the tenancy boundary. Users, roles, and membership wait until authentication is implemented. Optional opaque IDs such as `requestedById` may exist without a User entity.

### 7. Approval payload instead of ProposedAction

v0.1 uses `Approval.payload` for the proposed action. Do not introduce a ProposedAction entity until execution tooling needs a lifecycle independent of the approval decision.

---

## Consistency with existing docs

This model is intended to match:

- `README.md` — JS OS vs JS Growth boundaries; JS OS owns goals, work, agents, approvals, events, and integrations
- `docs/architecture.md` — business state before agents; tools as the execution boundary; observe/recommend/prepare/execute; human approval; AgentRun as audit history
- `docs/roadmap.md` — Phase 1 concepts: Organization, Goal, Work Item, Business Event, Approval, Agent Definition, Agent Run

No Prisma, database, API, UI, or agent-execution implementation is implied by this document.
