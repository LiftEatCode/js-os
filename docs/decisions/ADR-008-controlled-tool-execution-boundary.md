# ADR-008: Controlled tool execution boundary

## Status

Accepted

**Implemented:**
- ToolRequest/ToolExecution persistence (3.1)
- ToolDefinition + ToolRegistry (3.2)
- technical permission evaluator (3.3)

**Planned:**
- request lifecycle persistence (creating rows from a coordinator)
- approval integration
- execution coordinator
- real tools
- external adapters
- Command Center Tools

The execution boundary is not fully enforced yet. Permission evaluation is a pure check; nothing executes or persists a request.

## Context

JS OS will eventually let agents and other actors request capabilities that mutate business state or call external systems. Unrestricted model access to APIs, databases, shells, or credentials would bypass the operating system.

ADR-006 already decided that agents act only through explicit tools, that `AgentDefinition.permissionLevel` is a ceiling, and that Approval authorizes but does not execute. Phase 3 needs a durable model for that boundary: what a tool is, where its contract lives, how requests become executions, and how retries, approvals, and external side effects fit without a workflow engine.

Two persistence shapes were considered:

```text
Option A — ToolDefinition row + one ToolExecution row (request and attempt combined)
Option B — code registry + ToolRequest (logical action) + 0..N ToolExecution attempts
```

A single execution row would force authorization, attempt, retry, and result into one lifecycle. That becomes awkward as soon as an approved request is retried or an external call fails after intent is recorded.

## Decision

1. Actors never call integration clients, Prisma, or business-state mutations directly. Every executable capability passes through a registered tool and a centralized authorization/execution coordinator.
2. The immutable capability contract (slug, name, description, required permission, risk, approval requirement, version, schemas, implementation) lives in a **code registry**. Executable code is never stored in the database.
3. Durable operational records are **ToolRequest** (one logical action, including authorization) and **ToolExecution** (one attempt). Phase 3 may create at most one attempt per request. The schema must allow additional attempts later.
4. Approval remains authorization. `APPROVED ≠ EXECUTED`. A tool-linked Approval points at the ToolRequest; the request holds validated input. Approval `payload` must not become a second copy of the execution body.
5. Permission evaluation and approval evaluation are separate deterministic services. The tool adapter does not decide either.
6. Internal tools call existing business commands. They do not use Prisma directly and do not bypass command rules.
7. External side effects cannot join ADR-007’s single-database transaction. Intent is persisted first, the effect runs, then result and BusinessEvent are persisted. Partial-failure windows are accepted and documented; there is no distributed transaction.
8. Credentials never appear in model context, tool inputs, tool outputs, Approval payloads, or BusinessEvent metadata. Adapters fetch credentials server-side.
9. Generic escape-hatch tools (`shell.execute`, `http.request`, `sql.execute`, `javascript.eval`, raw Prisma, arbitrary filesystem write) are prohibited.

```text
Actor
  ↓
Tool Request
  ↓
Tool resolution (code registry)
  ↓
Permission evaluation
  ↓
Approval evaluation
  ↓
explicit execution continuation
  ↓
Tool Execution (attempt)
  ↓
adapter (business command or integration)
  ↓
BusinessEvent
```

## Consequences

- Phase 3 can implement a small internal-tool proof without redesigning authorization for later email, GitHub, JS Growth, or payments tools.
- Historical ToolRequests remain readable after a tool is removed from the live registry because identifying fields are snapshotted on the request.
- Retry workers, queues, policy evaluation (`CONDITIONAL` approval), and autonomous AgentRun-created requests are deferred. The model does not require them and does not prevent them.
- ADR-006’s enforcement gap is the implementation target of Phase 3, not a new product principle.

## Alternatives considered

- Database-driven ToolDefinition rows that store executable contracts: rejected. Arbitrary DB-defined execution is an unbounded control-plane.
- One ToolExecution row that is both request and attempt (Option A): rejected for v0.1 because approval, retry, and attempt identity would collide. Two models are justified; a workflow engine is not.
- Treating `AgentDefinition.permissionLevel = EXECUTE` as a blanket grant: already rejected by ADR-006; restated here so tool work cannot weaken it.
- Executing inside the Approval row when status becomes `APPROVED`: rejected; authorization and action stay separate.
- Persisting every OBSERVE read as a ToolExecution: rejected for Phase 3. Read capabilities may exist in the registry without an execution row.
