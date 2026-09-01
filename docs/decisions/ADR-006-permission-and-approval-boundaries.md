# ADR-006: Permission and approval boundaries

## Status

Accepted

**Implemented:** technical permission evaluator (`evaluateToolPermission`). `AgentDefinition.permissionLevel` is the maximum technical capability ceiling. `ToolDefinition.requiredPermission` is the minimum technical permission required. USER and SYSTEM skip the agent ceiling; they still require the tool to be enabled. Disabled tools deny every actor.

**Not implemented:** approval evaluation, operating policy, execution coordinator, real tools. EXECUTE still does not bypass approval, policy, risk controls, or tool enablement.

## Context

JS OS will eventually let AI recommend and prepare work. Unrestricted model access to email, GitHub, payments, or production would be unsafe.

## Decision

1. Agents act only through explicit tools (future).
2. `AgentDefinition.permissionLevel` is a ceiling: `OBSERVE` | `RECOMMEND` | `PREPARE` | `EXECUTE`. It is not permission to run every tool.
3. Each future tool defines its own permission and approval requirements.
4. Approval authorizes a proposed action (`Approval.payload`). Approval does not execute.
5. Consequential actions (external communications, publishing, spend, production deploys, refunds) should require owner approval.
6. Autonomy increases only after workflows are proven. Levels 3–6 in the long-term maturity model are future, not current capability.

Intended path:

```text
Agent → Tool Request → Permission Check → Approval Policy → Tool Execution → BusinessEvent
```

## Consequences

- Product work can proceed on business state without pretending agents can act
- Later tool work must not bypass Approval
- Phase 3 persistence is ToolRequest + ToolExecution with a code registry, not execution-inside-Approval ([ADR-008](ADR-008-controlled-tool-execution-boundary.md))
- Policy documents describe direction until enforcement exists
- Command Center (Milestone 2.7) can display and change the permission ceiling; that is configuration. Milestone 3.3 enforces the ceiling against registered tool requirements for AGENT actors. EXECUTE still does not bypass tools, policy, or approvals.

## Alternatives considered

- Unrestricted function calling from the model: rejected.
- Treat permissionLevel as a blanket execute grant: rejected.
- Execute inside the Approval row: rejected; authorization and execution stay separate.
