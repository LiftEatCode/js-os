# Tool architecture

**Status:** Future

Tools are the execution boundary. Agents must not receive unrestricted access to external services or important state mutations.

This layer is not implemented. There is no tool catalog, no tool-execution table, and no permission-enforcement runtime.

## Intended flow

```text
Agent
  ↓
Tool Request
  ↓
Permission Check
  ↓
Approval Policy
  ↓
Tool Execution
  ↓
BusinessEvent
```

1. An agent proposes a tool call.
2. JS OS checks `AgentDefinition.permissionLevel` as a ceiling, then the tool’s own permission rules.
3. If the action is consequential, an Approval is required. Approval authorizes; it does not execute.
4. Only then may execution tooling run.
5. The result is recorded as a BusinessEvent (and on the AgentRun).

## Rules

- `OBSERVE` / `RECOMMEND` / `PREPARE` / `EXECUTE` describe autonomy, not a blank check.
- Future tool request/execution history belongs on AgentRun-related records, not as a replacement for AgentRun.
- Do not select an orchestration framework in this document.

See [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md) and [autonomy policy](../policies/autonomy.md).
