# Agent architecture

**Status:** Implemented (models, persistence services, Command Center configuration UI). Runtime execution, tools, schedules, and chat are future.

## AgentDefinition

A configured AI role, not a run.

```text
AgentDefinition
= configured role / identity / permission ceiling / instructions

AgentDefinition exists
≠
operational autonomous agent exists
```

Fields: `id`, `organizationId`, `name`, `slug`, `description?`, `status`, `role`, `permissionLevel`, `instructions?`, `createdAt`, `updatedAt`.

- Unique `(organizationId, slug)` — not globally unique
- Status: `ACTIVE` | `PAUSED` | `DISABLED`
- Role: `CEO` | `SALES` | `MARKETING` | `CLIENT_OPERATIONS` | `ENGINEERING` | `FINANCE` | `GENERAL`
- Permission: `OBSERVE` | `RECOMMEND` | `PREPARE` | `EXECUTE`

`permissionLevel` is the **maximum autonomy ceiling**. It is not blanket permission to execute anything.

```text
OBSERVE     Can inspect state.
RECOMMEND   Can reason/recommend within future runtime.
PREPARE     Can prepare proposed actions/content.
EXECUTE     May execute only when tools + policy + approval rules also allow it.
```

```text
EXECUTE ≠ unrestricted execution
```

Phase 3 tools and Phase 4 policies still apply. There is no tool catalog, permission checker, or execution runner yet.

Status is configuration only:

```text
ACTIVE     Available for future runtime use.
PAUSED     Temporarily prevented from participating.
DISABLED   Administratively disabled.
```

Changing status does not start, pause, or stop a model, schedule, or worker.

### Command Center (Milestone 2.7)

Routes:

```text
/app/agents
/app/agents/[agentId]
```

There is no `/app/agents/new` and no Agent deletion. Identity fields (`name`, `slug`, `role`, `description`, `instructions`) are bootstrap-managed and read-only in the UI. The owner may change `status` and `permissionLevel` through separate forms when Command Center writes are enabled.

List order is organizational: CEO, Sales, Marketing, Client Operations, Engineering, Finance, General, then name/slug. GET filters: `status`, `role`, `permissionLevel` (unknown values ignored).

Other-organization IDs are not found. Reads go through `@/business-state` and `getJsSolutionsOrganization()`.

Status and permission mutations use the ADR-007 command boundary (`changeAgentStatusCommand` / `changeAgentPermissionLevelCommand`): one transaction mutates the AgentDefinition via `tx.orm` and appends `agent.status_changed` or `agent.permission_changed`. No-op changes (same status or permission) are rejected and do not write an event. Escalating to `EXECUTE` requires a server-validated confirmation checkbox.

The same `JS_OS_COMMAND_CENTER_WRITES` safeguard as Goals/Work/Approvals applies.

### Development bootstrap rows

**Status:** Implemented (development database)

`npm run db:bootstrap` creates these six AgentDefinition rows if they are missing. These are persistent organizational role definitions.

Permission levels in the table below are **initial defaults**. Later owner changes are preserved when bootstrap is rerun. Bootstrap does not continuously enforce mutable operating configuration.

Identity (`slug` + expected `role`) is checked. A known slug with the wrong role fails loudly and is not rewritten.

The rows do **not** mean LLM reasoning, agent runs, tools, autonomous execution, or scheduled operation exist.

Command Center Work (Milestone 2.4) may assign a WorkItem to an AgentDefinition. That is a configured-role pointer (`assignedAgentId`). It does not start an AgentRun and does not make the role operational. `WorkItem.agentRunId` remains the creating-run relationship and is not owner-editable.

| slug | role | permissionLevel |
|---|---|---|
| ceo | CEO | RECOMMEND |
| sales | SALES | RECOMMEND |
| marketing | MARKETING | RECOMMEND |
| client-operations | CLIENT_OPERATIONS | RECOMMEND |
| engineering | ENGINEERING | RECOMMEND |
| finance | FINANCE | OBSERVE |

CEO is initially `RECOMMEND`, not `EXECUTE`. Finance is initially more restrictive: `OBSERVE`. `instructions` is left null on create; operating policy stays in version-controlled documentation.

Deleting an AgentDefinition cannot cascade-delete historical AgentRuns (`Restrict` on `AgentRun.agentDefinitionId`). Command Center uses `DISABLED` instead of deletion.

## AgentRun

One execution of an AgentDefinition. This is the authoritative audit record. Chat history is not.

```text
AgentRun
= historical record of an agent execution attempt
```

Fields: `id`, `organizationId`, `agentDefinitionId`, `triggerType`, `triggerReference?`, `status`, `startedAt`, `completedAt?`, `inputSnapshot?`, `output?`, `error?`, `createdAt`.

No `updatedAt` in v0.1.

- Trigger: `MANUAL` | `SCHEDULED` | `BUSINESS_EVENT` | `WORK_ITEM` | `SYSTEM`
- Status: `QUEUED` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`
- `inputSnapshot` and `output` are Jsonb
- `error` is text

Relations: Organization, AgentDefinition, created WorkItems, Approvals. No direct BusinessEvent relation in v0.1.

If a WorkItem or Approval references the run via `agentRunId`, the run cannot be deleted (`Restrict`). See [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md).

Command Center shows recent runs (up to 20) on the Agent detail page: status, trigger, timestamps, and FAILED error text. `inputSnapshot` and `output` are **not** displayed (they may later contain substantial internal data and must never store secrets or chain-of-thought). There is no `/app/agent-runs/[id]` route, and no Run / Retry / Start UI. AgentRun creation belongs to later runtime phases.

`listAgentRuns` orders by `createdAt` desc. Command Center re-sorts by `startedAt` desc, then `createdAt`, then `id`. An optional `limit` may be passed; unbounded lists remain available to services that omit it.

## Intended long-term hierarchy

**Status:** Future

```text
CEO
├── Sales
├── Marketing
├── Client Operations
├── Engineering
└── Finance
```

Department operating definitions: [departments](../departments/ceo.md).

## Related

- [Tool architecture](tool-architecture.md)
- [Autonomy policy](../policies/autonomy.md)
- [Business-state services](business-state-services.md)
- [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md)
- [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md)
- [ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)
