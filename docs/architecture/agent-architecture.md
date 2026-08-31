# Agent architecture

**Status:** Implemented (models + persistence services). Runtime execution, tools, and chat are future.

## AgentDefinition

A configured AI role, not a run.

Examples of roles: CEO, Sales, Marketing, Client Operations, Engineering, Finance, General.

Fields: `id`, `organizationId`, `name`, `slug`, `description?`, `status`, `role`, `permissionLevel`, `instructions?`, `createdAt`, `updatedAt`.

- Unique `(organizationId, slug)` — not globally unique
- Status: `ACTIVE` | `PAUSED` | `DISABLED`
- Role: `CEO` | `SALES` | `MARKETING` | `CLIENT_OPERATIONS` | `ENGINEERING` | `FINANCE` | `GENERAL`
- Permission: `OBSERVE` | `RECOMMEND` | `PREPARE` | `EXECUTE`

`permissionLevel` is the **maximum autonomy ceiling**. It does not authorize individual tools. Future tools must define their own permission and approval requirements. No tool model exists yet.

### Development bootstrap rows

**Status:** Implemented (development database)

`npm run db:bootstrap` creates these six AgentDefinition rows if they are missing. These are persistent organizational role definitions.

Permission levels in the table below are **initial defaults**. Later changes (for example CEO `RECOMMEND` → `PREPARE`) are preserved when bootstrap is rerun. Bootstrap does not continuously enforce mutable operating configuration.

Identity (`slug` + expected `role`) is checked. A known slug with the wrong role fails loudly and is not rewritten.

```text
AgentDefinition exists
≠
operational autonomous agent exists
```

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
- [Business-state services](business-state-services.md)
