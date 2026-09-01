# Phase 3 — Tools + Permissions

**Status:** In progress. Milestones 3.1, 3.2, and 3.3 are implemented. Approval evaluation, execution, and Command Center Tools are not.

Phase 0–2 are complete. Phase 3 introduces the controlled execution boundary: registered tools, permission evaluation, request/execution lifecycle, approval integration, internal safe tools, and Command Center visibility.

Do not treat later Phase 3 milestones as shipped. 3.1 is persistence. 3.2 is the code registry. 3.3 is technical permission evaluation only.

## Objective

Make execution an explicit, permissioned tool boundary so actors never call integration clients or Prisma directly.

## Milestones

```text
3.1 Tool domain model + architecture     Implemented
3.2 Tool registry                        Implemented
3.3 Permission evaluation                Implemented
3.4 Tool request/execution lifecycle     Next
3.5 Approval integration                 Planned
3.6 Internal safe tools                  Planned
3.7 Tools Command Center                 Planned
3.8 Phase 3 integration + validation     Planned
```

## What this phase includes

- Tool architecture and code registry
- `ToolRequest` / `ToolExecution` persistence
- Permission ceiling vs required permission evaluation
- Static tool-level approval requirements (`NEVER` / `ALWAYS`)
- Internal tools that call existing business commands
- Execution auditing and Activity events
- Command Center Tools area

## What this phase excludes

- Policy engine (`CONDITIONAL`, spend thresholds, operating-rule evaluation)
- CEO reasoning / model invocation / autonomous AgentRuns that select tools
- JS Growth, email, GitHub, calendar, and payments adapters
- Scheduling, workers, queues
- Generic shell / HTTP / SQL / eval tools
- Credential stores beyond documenting the boundary
- Retry workers and RUNNING cancellation

## Milestone 3.1 — Tool domain model + architecture

**Status:** Implemented

- Prisma enums and `ToolRequest` / `ToolExecution` models
- Types and pure lifecycle/validation helpers in `src/tools/`
- Development migration `20260901T1638_add_tool_request_execution`
- **No tool execution, registry runtime, or UI**

Canonical design: [tool architecture](../architecture/tool-architecture.md), [ADR-008](../decisions/ADR-008-controlled-tool-execution-boundary.md).

## Milestone 3.2 — Tool registry

**Status:** Implemented

- `defineTool` + `ToolRegistry` / `createToolRegistry` in `src/tools/`
- Zod `inputSchema` required; optional `outputSchema`
- Duplicate slug rejection; deterministic `list()` by slug
- `getToolDefinitionSnapshot` for future ToolRequest rows
- **No production tool definitions, coordinator, or persistence writes**

## Milestone 3.3 — Permission evaluation

**Status:** Implemented

- Pure `evaluateToolPermission(actor, definition)` in `src/tools/evaluate-permission.ts`
- Typed denials: `TOOL_DISABLED`, `ACTOR_NOT_ALLOWED`, `INSUFFICIENT_PERMISSION`
- USER and SYSTEM skip the agent ceiling; AGENT requires `ACTIVE` and `rank(ceiling) >= rank(required)`
- Approval evaluation is **not** part of 3.3 (`evaluateToolApproval` remains planned for 3.5)
- No persistence, registry lookup, or AgentDefinition DB fetch inside the evaluator

## Milestone 3.4 — Tool request/execution lifecycle

**Status:** Planned

- Persist requests and attempts
- Valid status transitions
- Cancellation of pre-running requests
- `tool.requested` / `tool.cancelled` / `tool.denied` as applicable
- Still no adapter `execute()` for real work

## Milestone 3.5 — Approval integration

**Status:** Planned

- `ALWAYS` tools create/link Approval; request `WAITING_APPROVAL`
- `APPROVED` → `READY`, not executed
- `REJECTED` → `DENIED`
- Derived expiration refuse even when Approval status is still `PENDING`
- Existing Approval Command Center remains the decision UI unless 3.7 adds deep links

## Milestone 3.6 — Internal safe tools

**Status:** Planned

```text
internal.create_work_item
internal.update_work_status
```

Call `createWorkItemCommand` / `updateWorkItemStatusCommand`. Organization-scoped. No Prisma from adapters.

## Milestone 3.7 — Tools Command Center

**Status:** Planned

- `/app/tools`, `/app/tools/[toolSlug]`, `/app/tools/requests/[requestId]`
- One nav item
- Owner invocation of internal tools (not limited by agent ceiling; still enabled + validated + audited)
- Never display secrets

## Milestone 3.8 — Integration + validation

**Status:** Planned

- Typecheck, lint, test, build
- Docs reconciled to Implemented only for landed milestones
- HTTP/Command Center smoke of Tools flows
- Confirm Activity shows `tool.*` without a taxonomy redesign
- Confirm Approvals still do not execute on approve

## Exit criteria

- At least one internal non-production tool can be requested and allowed or denied according to documented permission rules
- Approval-required path can wait, approve, and only then execute via explicit continuation
- Enforcement of the full request/execution path does not exist yet. Technical permission evaluation (3.3) is implemented; the coordinator does not call it.
- No external integrations shipped as a Phase 3 requirement

## Key safety boundary

No unrestricted model access to email, GitHub, payments, production, shells, SQL, or arbitrary HTTP. Tools do not run consequential actions without the approval requirement on that tool. `EXECUTE` on an AgentDefinition is not a blanket grant.

## Related

- [Roadmap](../roadmap.md)
- [Tool architecture](../architecture/tool-architecture.md)
- [ADR-008](../decisions/ADR-008-controlled-tool-execution-boundary.md)
