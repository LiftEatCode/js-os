# ADR-006: Permission and approval boundaries

## Status

Accepted (architectural intent)

**Enforcement is not implemented.** There is no tool catalog, permission checker, or execution runner. Phase 3 records the execution-boundary design in [ADR-008](ADR-008-controlled-tool-execution-boundary.md); that ADR is also architectural intent until implementation lands.

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
- Command Center (Milestone 2.7) can display and change the permission ceiling; that is configuration, not tool/policy enforcement. EXECUTE still does not bypass tools, policy, or approvals.

## Alternatives considered

- Unrestricted function calling from the model: rejected.
- Treat permissionLevel as a blanket execute grant: rejected.
- Execute inside the Approval row: rejected; authorization and execution stay separate.
