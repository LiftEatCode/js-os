# Autonomy policy

**Status:** Designed, not implemented. Tool execution infrastructure is future.

This policy describes how much an agent may do. It is not a grant of specific tools.

## Current levels (v0.1)

These values exist on `AgentDefinition.permissionLevel`:

```text
OBSERVE
RECOMMEND
PREPARE
EXECUTE
```

| Level | Meaning |
|---|---|
| OBSERVE | Read business state. Do not propose or change. |
| RECOMMEND | Propose priorities, work, or actions. Do not mutate external systems. |
| PREPARE | Draft artifacts (messages, PRs, plans) without sending or deploying. |
| EXECUTE | May run tools that are separately permitted and, when required, approved. |

`permissionLevel` is the **maximum autonomy ceiling** for that definition. It does not authorize arbitrary tools. A definition at `EXECUTE` still cannot run a tool that the future tool catalog forbids or that still needs approval.

## Intended execution path

**Status:** Future

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

Until tools exist, no agent may execute side effects. Models and `permissionLevel` values only constrain future design.

## Long-term maturity (future)

Do not treat these as implemented:

```text
Level 0 — Observe
Level 1 — Recommend
Level 2 — Prepare
Level 3 — Execute low-risk work
Level 4 — Execute within policy
Level 5 — Manage department
Level 6 — CEO operates company
```

Levels 3–6 require proven workflows, tools, permission checks, and approval policy. They are not current capability.

Autonomy increases only after a workflow is reliable. Start as decision-support.

See [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md) and [tool architecture](../architecture/tool-architecture.md).
