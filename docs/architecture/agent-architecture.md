# Agent architecture

**Status:** Implemented (models). Runtime execution, tools, and chat are future.

## AgentDefinition

A configured AI role, not a run.

Examples of roles: CEO, Sales, Marketing, Client Operations, Engineering, Finance, General.

Fields: `id`, `organizationId`, `name`, `slug`, `description?`, `status`, `role`, `permissionLevel`, `instructions?`, `createdAt`, `updatedAt`.

- Unique `(organizationId, slug)` — not globally unique
- Status: `ACTIVE` | `PAUSED` | `DISABLED`
- Role: `CEO` | `SALES` | `MARKETING` | `CLIENT_OPERATIONS` | `ENGINEERING` | `FINANCE` | `GENERAL`
- Permission: `OBSERVE` | `RECOMMEND` | `PREPARE` | `EXECUTE`

`permissionLevel` is the **maximum autonomy ceiling**. It does not authorize individual tools. Future tools must define their own permission and approval requirements. No tool model exists yet.

Deleting an AgentDefinition cannot cascade-delete historical AgentRuns (`Restrict` on `AgentRun.agentDefinitionId`).

## AgentRun

One execution of an AgentDefinition. This is the authoritative audit record. Chat history is not.

Fields: `id`, `organizationId`, `agentDefinitionId`, `triggerType`, `triggerReference?`, `status`, `startedAt`, `completedAt?`, `inputSnapshot?`, `output?`, `error?`, `createdAt`.

No `updatedAt` in v0.1.

- Trigger: `MANUAL` | `SCHEDULED` | `BUSINESS_EVENT` | `WORK_ITEM` | `SYSTEM`
- Status: `QUEUED` | `RUNNING` | `COMPLETED` | `FAILED` | `CANCELLED`
- `inputSnapshot` and `output` are Jsonb
- `error` is text

Relations: Organization, AgentDefinition, created WorkItems, Approvals. No direct BusinessEvent relation in v0.1.

If a WorkItem or Approval references the run via `agentRunId`, the run cannot be deleted (`Restrict`). See [ADR-005](../decisions/ADR-005-agent-run-audit-provenance.md).

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
