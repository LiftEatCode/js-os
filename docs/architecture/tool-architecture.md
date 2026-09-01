# Tool architecture

**Status:** Milestones 3.1–3.4 implemented (persistence, code registry, technical permission evaluator, request/execution lifecycle services). Approval evaluation, adapters, and Command Center Tools are still planned.

```text
Actor
    ↓
resolved ToolDefinition
    ↓
requestToolUse     ← implemented (3.4)
    ↓
ToolRequest        ← durable logical action
    ↓
Authorization      ← 3.3 permission evaluator consumed by 3.4; 3.5 approval planned
    ↓
ToolExecution      ← attempt records; no adapter call yet
    ↓
Adapter            ← planned (3.6)
```

The persisted request/execution state machine exists. There is no approval row creation, real tool adapter, coordinator that calls adapters, or Command Center Tools area. Do not treat later Phase 3 milestones as shipped.

Tools are the controlled execution boundary. Actors must not receive unrestricted access to external services, credentials, or important state mutations.

```text
Agent / USER / SYSTEM
  ↓
Tool Request
  ↓
JS OS execution boundary
  ↓
permission / risk / approval checks
  ↓
Tool adapter
  ↓
Business command or external system
```

Not:

```text
Agent
  ↓
raw API client / Prisma / shell
  ↓
External system or database
```

See [ADR-008](../decisions/ADR-008-controlled-tool-execution-boundary.md) and [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md).

## Vocabulary

| Term | Meaning |
|---|---|
| Tool | A controlled capability JS OS knows how to execute |
| Tool definition | Immutable capability contract in the code registry |
| Tool implementation | Future executable adapter (`execute`). Not in 3.2. |
| Tool request | One logical action: who asked, which tool, validated input, authorization state |
| Tool execution | One attempt to carry out a request |
| Permission ceiling | Maximum autonomy on an AgentDefinition (`OBSERVE` < `RECOMMEND` < `PREPARE` < `EXECUTE`) |
| Required permission | Minimum ceiling a tool needs from an agent actor |
| Risk | Consequence of successful execution (`LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`) |
| Approval requirement | Whether an Approval must exist before execution (`NEVER` \| `ALWAYS` in v0.1) |

Business commands and tools are different:

```text
Business command
= application-level atomic mutation inside JS OS (ADR-007)

Tool
= controlled capability exposed to actors

Internal tool implementations may invoke business commands.
They must not call Prisma directly.
```

Do not call tools “agents”, “actions”, “skills”, or “commands” interchangeably.

## Actors

```text
USER
AGENT
SYSTEM
```

Phase 3 does not implement autonomous agent behavior, model invocation, scheduled SYSTEM calls, or CEO loops. The model reserves those actors.

- **USER** is not limited by an AgentDefinition permission ceiling. Owner invocation still requires the tool to be enabled, input validation, approval when the tool says `ALWAYS`, organization scoping, execution lifecycle, and audit.
- **AGENT** is limited by the referenced AgentDefinition’s `permissionLevel` and `ACTIVE` status.
- **SYSTEM** is reserved for future scheduled operations. The 3.3 evaluator may technically allow SYSTEM for an enabled tool. There is no scheduler or SYSTEM invocation path.

## Permission ceiling vs required permission

`AgentDefinition.permissionLevel` is a **ceiling**, not a blanket grant.

Ordering (deterministic ranks, no extra enum values):

```text
OBSERVE < RECOMMEND < PREPARE < EXECUTE
```

The permission layer answers:

```text
actor permission ceiling >= tool required permission?
```

Examples:

```text
Agent ceiling: PREPARE
Tool required permission: PREPARE
→ permission layer may allow

Agent ceiling: PREPARE
Tool required permission: EXECUTE
→ deny (INSUFFICIENT_PERMISSION)
```

Passing the ceiling is not execution permission:

```text
Agent ceiling: EXECUTE
Tool: issue_refund
required permission: EXECUTE
risk: HIGH
approval: ALWAYS

→ permission ceiling passes
→ approval requirement still applies
→ APPROVED still does not execute
```

Phase 4 operating policy is a later additional gate, not a Phase 3 evaluator.

## Tool definition source of truth

**Code registry** for implementation and immutable capability contract.

**Database** only for operational records (ToolRequest, ToolExecution) and, later if needed, org-scoped enablement.

Rejected:

- Database rows as the executable contract
- Storing code, HTTP templates, or scripts in PostgreSQL
- A giant Prisma enum of every tool slug

Phase 3 v0.1 enablement is a boolean on the registry entry (`enabled`). A future `ToolConfiguration` table (`organizationId` + `toolSlug` + enabled) can disable a dangerous integration without deleting code. That table is not implemented.

## Identity and naming

Stable, machine-friendly slugs. `lowercase.dot.notation`. Last segment uses `snake_case`.

```text
<namespace>.<verb>_<object>
```

Examples (not all Phase 3):

```text
internal.create_work_item
internal.update_work_status
business.read_summary
work.create
email.send
github.read_issue
github.create_issue
js_growth.find_prospects
```

Rules:

- Namespace is the category. A string prefix is enough; do not add a `ToolCategory` enum unless a concrete UI/filter need appears.
- Slugs are stable. Renames require a new slug or an explicit alias; historical rows keep the original slug snapshot.
- Do not put organization IDs, versions, or actor IDs in the slug.
- Maximum length should match existing `actionType` discipline (120).

Suggested namespaces: `internal`, `business`, `work`, `approval`, `email`, `calendar`, `github`, `payments`, `js_growth`.

## Versioning

Integer `version` on the registry definition, starting at `1`.

Bump when the input contract, output contract, or execution semantics change in a way that would mis-interpret old rows.

Persist on every ToolRequest:

```text
toolSlug
toolName
toolVersion
```

Historical UI must not resolve only the live registry. A removed tool remains displayable from snapshots.

## Registry (implemented in 3.2)

Code registry is the source of truth for executable contracts. PostgreSQL is not consulted to know which tools exist.

```text
Code registry
  ↓
ToolDefinition
  ├── stable slug
  ├── version
  ├── enabled
  ├── required permission
  ├── risk
  ├── approval requirement
  ├── persistExecution
  ├── input schema (Zod, required)
  └── optional output schema (Zod)
```

```text
src/tools/definition.ts     defineTool, snapshot helper
src/tools/registry.ts       ToolRegistry / createToolRegistry
src/tools/lifecycle.ts
src/tools/validation.ts
```

`defineTool` validates slug (existing 3.1 helper, no rewrite), version ≥ 1, trimmed non-empty name/description, booleans, and a Zod `inputSchema`. It does not register, persist, or execute. `Object.freeze` protects the top-level contract; Zod internals are not deep-frozen.

`ToolRegistry` is an isolated in-memory catalog (`Map` encapsulated). Construct with `createToolRegistry(definitions)` or `new ToolRegistry(definitions)`. There is **no** app-global populated singleton. Production composition happens in 3.6 when real tools exist.

- One active contract per slug. Duplicate slugs are rejected even if versions differ.
- `get(slug)` returns `ToolDefinition | null`. `require(slug)` throws `ToolNotFoundError`.
- `list()` / `listEnabled()` sort by slug (`en`). Disabled tools stay in the registry.
- `persistExecution` is metadata only. `false` does **not** bypass permission checks. 3.4 `requestToolUse` rejects non-persisted definitions rather than writing rows.
- `getToolDefinitionSnapshot` maps `slug/name/version/requiredPermission/riskLevel/approvalRequirement` onto ToolRequest snapshot fields. It is not persisted here.

No `src/tools/definitions/` yet. First real tools (`internal.create_work_item`, `internal.update_work_status`) arrive in 3.6. Read capabilities may use `persistExecution: false` later.

Future binding (not implemented):

```text
ToolDefinition + ToolImplementation → registered executable capability
```

Still planned: `evaluate-permission.ts`, `evaluate-approval.ts`, `coordinator.ts`.

The adapter **must not** decide permission or approval. The future coordinator calls `execute` only after those checks pass and the request is `READY`.

Do not add generic transport fields (`url`, `httpMethod`, `sql`, `shellCommand`) or credentials to ToolDefinition. Actor-facing generic tools (`shell.execute`, `http.request`, `sql.execute`, `javascript.eval`, raw Prisma) remain prohibited.

## Database models

Implemented in the Prisma contract and applied to the Neon development branch (`migrations/app/20260901T1638_add_tool_request_execution`). There is no `ToolDefinition` table.

### ToolRequest

One logical action.

```text
id
organizationId
toolSlug              String
toolName              String          // snapshot
toolVersion           Int             // snapshot
requiredPermission    ToolRequiredPermission  // snapshot
riskLevel             ToolRiskLevel           // snapshot
approvalRequirement   ToolApprovalRequirement // snapshot
status                ToolRequestStatus
input                 Jsonb           // validated input only
requestedByType       ToolActorType
requestedById         String?         // opaque until auth
agentDefinitionId     Uuid?
agentRunId            Uuid?
workItemId            Uuid?
approvalId            Uuid?
idempotencyKey        String?
requestedAt           Timestamptz
createdAt
updatedAt
```

### ToolExecution

One attempt.

```text
id
organizationId
toolRequestId
attemptNumber         Int             // 1-based
status                ToolExecutionStatus
output                Jsonb?
error                 String?
startedAt             Timestamptz?
completedAt           Timestamptz?
createdAt
```

`ToolExecution.id` is the stable attempt identifier for future integration idempotency keys.

`organizationId` is duplicated on ToolExecution even though it can be inferred from ToolRequest. That is intentional: org-scoped queries, dashboards, and authorization checks should not require a join. Application code must keep `ToolExecution.organizationId` equal to `ToolRequest.organizationId`. PostgreSQL does not enforce that cross-row rule.

ToolExecution has no `updatedAt`. Attempts are append-oriented; later status changes (milestone 3.4) update `status` / timestamps only.

## Enums

Entity-specific, even when labels match existing types.

```text
ToolRequestStatus
  REQUESTED
  WAITING_APPROVAL
  READY
  FULFILLED
  FAILED
  CANCELLED
  DENIED

ToolExecutionStatus
  QUEUED
  RUNNING
  SUCCEEDED
  FAILED
  CANCELLED

ToolRequiredPermission
  OBSERVE
  RECOMMEND
  PREPARE
  EXECUTE

ToolRiskLevel
  LOW
  MEDIUM
  HIGH
  CRITICAL

ToolApprovalRequirement
  NEVER
  ALWAYS

ToolActorType
  USER
  AGENT
  SYSTEM
```

`CONDITIONAL` approval is **not** in the v0.1 enum. It would be a fake policy engine. Phase 4 may add it.

## Lifecycle

### ToolRequest

```text
REQUESTED
  ├── WAITING_APPROVAL
  ├── READY
  ├── DENIED
  └── CANCELLED

WAITING_APPROVAL
  ├── READY          (linked Approval becomes APPROVED)
  ├── DENIED         (linked Approval REJECTED, or derived-expired refuse)
  └── CANCELLED

READY
  ├── FULFILLED      (an attempt SUCCEEDED; execution-derived, not a public request mutation)
  ├── FAILED         (an attempt FAILED; execution-derived, not a public request mutation)
  └── CANCELLED

FULFILLED, FAILED, CANCELLED, DENIED are terminal in v0.1.
```

Future retries may reopen `FAILED` → `READY` without a schema change. Do not implement retry workers in Phase 3.

`ToolRequest FULFILLED` and `FAILED` are **execution-derived terminal states** in v0.1. The only supported paths are `completeToolExecution` (SUCCEEDED + FULFILLED + `tool.executed`) and `failToolExecution` (FAILED + FAILED + `tool.execution_failed`), each in one transaction. There is no public `fulfillToolRequest` / `failToolRequest`. `src/tools/lifecycle.ts` still knows `READY → FULFILLED` / `READY → FAILED` as valid conceptual transitions; that is state-machine knowledge, not a public mutation API.

`ToolRequest.status = FAILED` means at least one actual execution attempt ran and the logical action did not succeed. Do **not** use `FAILED` for invalid input, disabled tools, insufficient permission, unsupported actors, or approval required/rejected/expired. Those either prevent request creation or result in `DENIED`, `WAITING_APPROVAL`, or `CANCELLED`.

Pure transition helpers live in `src/tools/lifecycle.ts`. Persistence transitions are implemented in 3.4 (`src/tools/requests.ts`, `src/tools/executions.ts`, `src/tools/request-tool.ts`).

`REQUESTED` is a **conceptual** insert state. `requestToolUse` validates input, evaluates permission, and routes in one transaction. The persisted row lands on the routed status (`READY`, `WAITING_APPROVAL`, or `DENIED`). Transient `REQUESTED` is not externally visible. Explicit transition helpers still accept `REQUESTED` if a row in that status ever exists.

Invalid input does **not** create a ToolRequest. Permission denial **does** create a `DENIED` audit row (`tool.denied`) with no ToolExecution.

### ToolExecution

```text
QUEUED
  ├── RUNNING
  └── CANCELLED

RUNNING
  ├── SUCCEEDED
  └── FAILED
```

v0.1: at most one **successful or failed** execution per request, because `FULFILLED` / `FAILED` are terminal. The schema allows 0..N `ToolExecution` rows. There is no automatic retry. `RUNNING` cancellation is unsupported. `SUCCEEDED` / `FAILED` cannot become `CANCELLED`.

A cancelled `QUEUED` attempt leaves a `READY` request, so a later manual attempt could be created. That is not an automatic retry. Future retry semantics may require an explicit reopen of `FAILED` → `READY`. Do not invent that now.

## JSON

The contract now has six intentional JSON columns:

```text
BusinessEvent.metadata
Approval.payload
AgentRun.inputSnapshot
AgentRun.output
ToolRequest.input
ToolExecution.output
```

| Field | Why JSON | What it is not |
|---|---|---|
| `ToolRequest.input` | Tool args vary by slug; future Zod validation before persist | Generic metadata bag; credentials; unvalidated actor JSON |
| `ToolExecution.output` | Normalized success payload; small structured result | Raw third-party dumps; secrets; full HTTP transcripts |

Do not add generic `metadata` JSON on these models. Request identity, status, risk, and provenance stay typed. Milestone 3.4 validates `input` with `definition.inputSchema.safeParse` before persist and stores the parsed value. Output schema validation on success is deferred to a future coordinator so execution persistence stays decoupled from registry lookup.

`Approval.payload` for a tool-linked Approval is a **small pointer**, not a copy of `input`:

```json
{
  "toolRequestId": "...",
  "toolSlug": "internal.create_work_item"
}
```

## Relations and referential actions

No Cascade.

| Relation | Action | Why |
|---|---|---|
| ToolRequest.organizationId | Restrict | Org-scoped; orgs are not deleted |
| ToolExecution.organizationId | Restrict | Same |
| ToolRequest.agentDefinitionId | Restrict | Definitions are not deleted (`DISABLED` only) |
| ToolRequest.agentRunId | Restrict | Audit provenance; AgentRuns are not deleted |
| ToolRequest.approvalId | Restrict | Approvals are not deleted |
| ToolRequest.workItemId | SetNull | Optional operational link; matches Approval → WorkItem |
| ToolExecution.toolRequestId | Restrict | Attempts cannot outlive the logical request |

`agentDefinitionId` is required when `requestedByType = AGENT`. That is an **application** invariant for a later persistence layer, not a PostgreSQL CHECK. `agentRunId` is optional even for agents (USER and future SYSTEM never require it). `workItemId` is optional.

Uniques:

```text
ToolRequest   (organizationId, toolSlug, idempotencyKey)
ToolExecution (toolRequestId, attemptNumber)
```

PostgreSQL `UNIQUE` treats NULL as distinct (`NULLS DISTINCT`). Multiple ToolRequest rows may share the same organization and slug with `idempotencyKey IS NULL`. A non-null key must be unique per organization + slug. The same key may be reused for a different slug or a different organization. Verified against the development database with rolled-back inserts (`npm run tool-schema:verify`).

Indexes (query-oriented plus Prisma FK indexes):

```text
ToolRequest
  (organizationId, status, requestedAt)
  (organizationId, toolSlug, requestedAt)
  organizationId
  agentDefinitionId
  agentRunId
  workItemId
  approvalId

ToolExecution
  (organizationId, status)
  (organizationId, createdAt)
  organizationId
  toolRequestId
```

## Database vs application responsibilities

Enforced by PostgreSQL:

- org FKs, provenance FKs, unique attempt numbers, unique non-null idempotency keys, enum CHECKs

Enforced by application code in 3.4 (helpers exist in `src/tools/validation.ts`):

- `requestedByType = AGENT` → `agentDefinitionId` required
- `ToolExecution.organizationId` equals `ToolRequest.organizationId`
- tool slug format, `toolVersion >= 1`, `attemptNumber >= 1`
- valid status transitions (`src/tools/lifecycle.ts`)

## Domain helpers

```text
src/tools/types.ts
src/tools/lifecycle.ts
src/tools/validation.ts
src/tools/definition.ts
src/tools/registry.ts
src/tools/evaluate-permission.ts
src/tools/request-tool.ts
src/tools/requests.ts
src/tools/executions.ts
src/tools/index.ts
```

No coordinator or `execute`. The registry does not import Prisma or `db`. `evaluateToolPermission` remains pure. Request/execution services persist through `runBusinessCommand` / `commitStateAndEvent`.

## Input and output validation

```text
registry definition
  ↓
Zod (or equivalent) input schema
  ↓
validated typed input persisted on ToolRequest
  ↓
execute(context, input)
  ↓
normalize / optionally parse output schema
  ↓
persist ToolExecution.output
```

Never pass unvalidated JSON to `execute`. Implementations return a small result object. Coordinator persists only the normalized form. Failures store `error` as a short string, not a stack dump of internals or upstream bodies.

Read tools with `persistExecution: false` still validate input in memory when a future coordinator asks. They do not write ToolRequest rows in v0.1.

`requestToolUse` is the **persisted** request path. It rejects `persistExecution: false` rather than silently writing rows. The non-persisted runtime path is planned coordinator work, not implemented in 3.4.

## Execution context

Constrained. No raw Prisma, no env object, no unbounded HTTP.

Conceptual contents:

```text
organizationId
actorType
actorId?
agentDefinitionId?
approvalId?
toolRequestId
toolExecutionId
credential accessor   // server-side only; never serializable to models
logger / event recorder
```

## Credential boundary

```text
LLMs never receive raw credentials.
Tool requests never contain credentials.
```

Future adapters:

```text
Tool implementation
  ↓
credential provider
  ↓
environment / secret store / OAuth connection
```

Agents and UI may see “GitHub connection available”, never `GITHUB_TOKEN=...`.

## Permission evaluation

**Status:** Implemented (Milestone 3.3). Pure function `evaluateToolPermission(actor, definition)` in `src/tools/evaluate-permission.ts`. It does not look up the registry, fetch AgentDefinitions, persist rows, or inspect approval/risk/`persistExecution`.

`enabled` is currently the registry’s global code-level flag. A future `ToolConfiguration` layer may supply an effective-enabled result; that is not implemented.

Implemented order:

```text
Resolved ToolDefinition
      ↓
enabled?
      ↓
actor supported/active?
      ↓
agent ceiling sufficient?
      ↓
ALLOW / DENY
```

Denial precedence:

```text
1. TOOL_DISABLED
2. ACTOR_NOT_ALLOWED
3. INSUFFICIENT_PERMISSION
4. ALLOW
```

Inputs:

```text
actor (USER | AGENT | SYSTEM projection; no DB object)
definition.enabled
definition.requiredPermission
AGENT only: agentDefinition.status, agentDefinition.permissionLevel
```

Algorithm:

1. If the tool is not enabled → `TOOL_DISABLED` (all actors).
2. If `actor.type` is unknown or unsupported → `ACTOR_NOT_ALLOWED`.
3. If `actor.type = AGENT` and definition is missing or not `ACTIVE` → `ACTOR_NOT_ALLOWED`.
4. If `actor.type = AGENT` and `rank(ceiling) < rank(required)` → `INSUFFICIENT_PERMISSION`.
5. If `actor.type = USER` or `SYSTEM`, skip the agent ceiling (USER/SYSTEM are not AgentDefinitions).
6. Otherwise `allowed: true`.

Ranks are numeric, not lexical: `OBSERVE=0 < RECOMMEND=1 < PREPARE=2 < EXECUTE=3`. Agent and tool permission enums are ranked separately with the same semantics.

USER is technically allowed for any enabled tool. That is not unrestricted execution: later approval, policy, input validation, and the coordinator still apply.

SYSTEM is technically allowed for any enabled tool. It is reserved for future scheduled/system workflows. There is no SYSTEM invocation path, scheduler, or production SYSTEM caller. Tests only.

Tool-not-found belongs to registry lookup, not this evaluator. The core function assumes a resolved `ToolDefinition`.

Approval evaluation is not part of 3.3. `approvalRequirement` and `riskLevel` are ignored by the evaluator. 3.4 reads `approvalRequirement` only to route `ALWAYS` → `WAITING_APPROVAL` or `NEVER` → `READY` after permission allow. That routing does **not** create an Approval row.

## Request / execution lifecycle (Milestone 3.4)

**Status:** Implemented. No real adapters, queues, workers, or approval satisfaction.

Entry point: `requestToolUse({ organizationId, actor, definition, input, agentRunId?, workItemId?, idempotencyKey? })`.

```text
valid input
      ↓
evaluateToolPermission(actor, definition)
      ↓
persist ToolRequest + BusinessEvent (one transaction)
      ├── DENIED              (permission denied; no ToolExecution)
      ├── WAITING_APPROVAL    (allowed + ALWAYS; no Approval row yet)
      └── READY               (allowed + NEVER)
```

3.4:

```text
approvalRequirement=ALWAYS
→ ToolRequest WAITING_APPROVAL

but no Approval row is created yet.
```

3.5 will connect `WAITING_APPROVAL` to durable Approval authorization.

Snapshot fields (`toolSlug`, `toolName`, `toolVersion`, `requiredPermission`, `riskLevel`, `approvalRequirement`) come only from `getToolDefinitionSnapshot`. Callers cannot override them.

Actor mapping: USER (`requestedById` optional), AGENT (`requestedById` and `agentDefinitionId` from the DB AgentDefinition), SYSTEM (`requestedById` null). AGENT permission evaluation uses the database AgentDefinition, not the caller's claimed ceiling.

Optional `agentRunId` / `workItemId` must exist in the same organization. AGENT runs must belong to the requesting AgentDefinition.

Idempotency: unique `(organizationId, toolSlug, idempotencyKey)` when the key is non-null. Same logical request returns the existing row without a second event. A different logical request with the same key throws `ToolIdempotencyConflictError`. Comparison uses canonical JSON for `input`.

Execution attempts: only `READY` requests. `attemptNumber` is server-derived (1, then 2, …) inside a transaction; unique `(toolRequestId, attemptNumber)` is the database backstop. Residual limitation: concurrent creates retry the whole command on unique violation (3 attempts). No automatic retries after `FAILED`.

```text
READY
  → create ToolExecution QUEUED
  → RUNNING
  → SUCCEEDED  (request FULFILLED, same transaction, tool.executed)
  → FAILED     (request FAILED, same transaction, tool.execution_failed)

QUEUED → CANCELLED (request stays READY unless the request is cancelled)

Request CANCELLED from REQUESTED / WAITING_APPROVAL / READY
  cancels QUEUED executions in the same transaction
  rejects cancellation if a RUNNING execution exists
```

`ToolRequest FULFILLED` and `FAILED` are execution-derived terminal states in v0.1. Public request services can cancel, deny, or route to READY / WAITING_APPROVAL; they cannot independently fulfill or fail a request.

`ToolRequest FAILED` still means an attempt actually ran. Invalid input, disabled tools, permission denial, and missing references do not use `FAILED`.

Event strategy: one outcome event at creation (`tool.ready` / `tool.waiting_approval` / `tool.denied`). There is no extra `tool.requested`. Later: `tool.execution_queued`, `tool.execution_started`, `tool.executed`, `tool.execution_failed`, `tool.cancelled`. Metadata is IDs, slug, version, status, attemptNumber, and `denialCode` when relevant. Full input/output is not copied into BusinessEvent metadata.

## Approval evaluation

**Status:** Planned (Milestone 3.5). 3.4 may persist `WAITING_APPROVAL` from static `approvalRequirement=ALWAYS` without creating or linking an Approval.

Separate service `evaluateToolApproval`.

v0.1:

```text
NEVER  → no Approval required
ALWAYS → an in-org Approval must exist, reference this request, be APPROVED,
         and not be past expiresAt
```

Do not invent CONDITIONAL rules in Phase 3.

## Permission and approval result shape

Keep the two evaluations distinct even if a coordinator wraps them.

```text
{
  allowed: boolean
  permission: { allowed: boolean, code?: ToolPermissionDenialCode }
  approval: { allowed: boolean, code?: ToolApprovalDenialCode, approvalId?: string }
}

ToolPermissionDenialCode
  TOOL_DISABLED
  INSUFFICIENT_PERMISSION
  ACTOR_NOT_ALLOWED

ToolApprovalDenialCode
  APPROVAL_REQUIRED
  APPROVAL_NOT_APPROVED
  APPROVAL_EXPIRED
```

`APPROVAL_REQUIRED` means create or wait for an Approval; it is not a permission-ceiling failure.

## Approval integration

Preserve:

```text
APPROVED ≠ EXECUTED
```

```text
Tool Request
  ↓
ALWAYS? → create Approval (PENDING), request WAITING_APPROVAL
  ↓
owner decides
  ↓
APPROVED → request READY (still not executed)
  ↓
explicit continuation
  ↓
Tool Execution
```

Linkage: `ToolRequest.approvalId → Approval.id`. Do not add a required `toolRequestId` on Approval in v0.1; reverse lookup is `ToolRequest` where `approvalId` matches. `Approval.actionType` should equal `toolSlug`. Copy `workItemId` / `agentRunId` / requester fields when present so the existing Approvals UI remains coherent.

Standalone owner-created Approvals (Phase 2 forms) remain valid. They are not ToolRequests until a coordinator consumes them. Phase 3 should not reinterpret every Approval as a tool call.

## Approval rejection

Linked Approval `REJECTED` → ToolRequest `DENIED`. Do not execute. This is not `CANCELLED` (withdrawal) and not `FAILED` (an attempt ran).

## Approval expiration

Phase 2 has no expiration worker. Past `expiresAt` may still be `PENDING`.

Execution and approval evaluation must **refuse** if `expiresAt` is in the past, even when persisted status is still `PENDING`. That matches existing derived-expiration semantics. Do not assume a row has been moved to `EXPIRED`.

## Risk

Reuse the existing four-level vocabulary. Risk describes consequences of execution. It does not imply actor permission.

| Example | Typical risk | Typical approval (v0.1) |
|---|---|---|
| Read internal business state | LOW | NEVER (and usually not persisted) |
| Create internal WorkItem | LOW | NEVER |
| Prepare email draft | LOW / MEDIUM | NEVER until an outbound send tool exists |
| Send external email | MEDIUM | ALWAYS initially |
| Publish public content | MEDIUM | ALWAYS |
| Issue refund | HIGH / CRITICAL | ALWAYS |
| Delete production resource | CRITICAL | ALWAYS |

Numeric spend thresholds stay out of Phase 3 (Phase 4 / finance policy).

## Organization scope

Every ToolRequest and ToolExecution belongs to one Organization. No cross-organization execution. Referenced WorkItem, Goal (via command input), Approval, AgentDefinition, and AgentRun must be the same organization. Coordinators re-check org on every transition, matching existing command practice.

## Provenance

```text
requestedByType + requestedById
agentDefinitionId?   when AGENT
agentRunId?          optional future parent of a request
```

Do not duplicate contradictory actor fields. USER Command Center writes follow Approval: `requestedByType = USER`, `requestedById` null until auth exists. Do not fabricate user UUIDs.

## AgentRun

Optional. Future path:

```text
AgentRun → ToolRequest → ToolExecution
```

USER invocation must not require an AgentRun. Phase 3 should not create AgentRuns in order to run internal tools.

## WorkItem

Optional `workItemId` on the request.

- `internal.update_work_status`: required in input; copied onto the request after org validation.
- `internal.create_work_item`: null at request time; coordinator may set it from the command result after success so history can link.

Do not auto-set WorkItem `WAITING_APPROVAL` when a tool needs approval. That Phase 2 independence stays unless a later milestone explicitly couples them.

## BusinessEvent taxonomy

3.4 emits:

```text
tool.denied
tool.waiting_approval
tool.ready
tool.execution_queued
tool.execution_started
tool.executed
tool.execution_failed
tool.cancelled
```

Creation records the routed outcome only. `tool.requested` is reserved and not emitted, to avoid a duplicate “created then routed” pair. Approval activity remains:

```text
approval.requested
approval.approved
approval.rejected
approval.cancelled
```

`tool.waiting_approval` in 3.4 does **not** imply `approval.requested`. 3.5 will add the Approval row and `approval.*` event.

Internal tools that call business commands will also emit domain events (`work.created`, `work.status_changed`). That is two layers, not duplication of Approval events. Tool metadata is IDs only: `toolRequestId`, `toolExecutionId`, `toolSlug`, `toolVersion`, status, `attemptNumber`, `denialCode`. No input dump, no credentials.

Activity (`/app/activity`) already formats arbitrary `lowercase.dot` names. Do not redesign Activity.

## External side-effect consistency

ADR-007 applies to **internal database mutations**. External HTTP/API effects cannot be in that transaction.

```text
1. Persist ToolRequest + ToolExecution (QUEUED / RUNNING)
2. Commit
3. Perform external effect (idempotency key = ToolExecution.id when the vendor supports it)
4. Persist result + tool.executed or tool.failed (+ domain events if any)
```

Partial-failure windows:

- Intent persisted, effect never sent (crash before call)
- Effect sent, result persist fails (unknown outcome; retry must be idempotent)
- Effect succeeded, event write fails (state true, Activity incomplete)

Do not pretend a distributed transaction exists. Recovery/workers are future. v0.1 internal tools should compose ToolExecution status + business command + events in **one PostgreSQL transaction** when there is no external I/O.

## Idempotency

- Request-level: optional `idempotencyKey` unique per organization + tool slug.
- Attempt-level: `ToolExecution.id` is the key adapters pass to vendors later.

Do not implement vendor idempotency in Phase 3. Do not design a model that overwrites a succeeded attempt in place.

## Retry

ToolRequest supports 0..N ToolExecution records structurally.

v0.1 lifecycle does not automatically retry. `FAILED` is terminal. Explicit retry / reopen semantics are future work. Schema allows `attemptNumber` 2..N later. No queues.

## Cancellation

Valid on ToolRequest: `REQUESTED`, `WAITING_APPROVAL`, `READY` → `CANCELLED`.

If `WAITING_APPROVAL`, 3.5 will cancel the linked Approval via the existing cancel command when that Approval is still `PENDING`. 3.4 has no Approval row to cancel.

Not valid: `FULFILLED`, `FAILED`, `DENIED`, or after an execution `SUCCEEDED` / `FAILED`.

QUEUED executions become `CANCELLED` with the request. RUNNING cancel is unsupported in v0.1.

## Read tools

Registry capabilities may exist for observation (`business.read_summary`, list goals/work) so a future agent catalog is consistent.

v0.1: `persistExecution: false` for those reads. Do not write a ToolRequest per page load or per OBSERVE call. Permission still applies in-process when a coordinator is asked.

Persisting every read would drown Activity and execution history.

## First executable tools

Prove the boundary with internal, non-external tools that call existing commands:

```text
internal.create_work_item     required PREPARE   risk LOW   approval NEVER
internal.update_work_status   required PREPARE   risk LOW   approval NEVER
```

Do not add email, GitHub, calendar, payments, or JS Growth adapters in Phase 3.

Do not add `internal.create_approval_request` in the first set: it blurs Approval-as-authorization with tools-as-execution. Owner Approval forms already exist.

Do not add a tool that bypasses WorkItem command rules (org scope, status transitions, assignment constraints).

## Owner invocation

Phase 3 Command Center should allow the owner to invoke the first internal tools so the boundary can be validated without autonomous agents. Same lifecycle, no agent ceiling, still no unsafe generic tools.

## Command Center (planned UI; do not implement in this design pass)

Add one nav item **Tools** when milestone 3.7 lands.

```text
/app/tools                         registry + recent requests
/app/tools/[toolSlug]              definition snapshot + invoke (if allowed)
/app/tools/requests/[requestId]    request + attempts + approval link
```

A separate `/app/tool-executions` index is unnecessary if requests list attempts.

Show: tool, actor, status, risk, requested/started/completed times, approval if any, result summary, error. Never secrets. Never dominant raw JSON.

## Security prohibitions

Actor-facing tools must not include:

```text
shell.execute
http.request
sql.execute
database.raw_query
javascript.eval
filesystem.write_anywhere
arbitrary Prisma access
arbitrary URL fetch unless a specific tool validates a closed URL set
```

Capabilities are business-purpose-specific.

## Phase handoffs

**Phase 4 — policy:** Phase 3 answers “can this actor technically use this tool?” Phase 4 answers “should this action be allowed under operating policy?” Future formula: ceiling + required permission + enabled + policy + approval state. Do not implement policy evaluation now. `CONDITIONAL` waits for Phase 4.

**Phase 5 — CEO loop:** CEO AgentRun selects a registered capability and creates a ToolRequest. The CEO must not receive a bypass around this boundary.

**Phase 6 — JS Growth:** Register adapters such as `js_growth.find_prospects`. JS Growth remains canonical. Tools call JS Growth; they do not duplicate its tables.

**Phase 7 — Sales composition:** Same authorization. Sales workflows chain registered tools (find, audit, prepare, approve, send). No new permission model.

High autonomy later: `EXECUTE` + policy allow + enabled + risk within threshold + approval not required → execute without intervention. CRITICAL / financial / destructive tools may remain `ALWAYS`. Phase 3 must not make that impossible.

## What Phase 3 excludes

Policy engine, CEO reasoning, model invocation, autonomous agents, JS Growth / email / GitHub / calendar / payments integrations, scheduling, workers, queues, cross-department coordination, generic HTTP/SQL/shell tools.

## Related

- [ADR-008](../decisions/ADR-008-controlled-tool-execution-boundary.md)
- [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md)
- [ADR-007](../decisions/ADR-007-atomic-business-mutation-and-event-recording.md)
- [Approval system](approval-system.md)
- [Agent architecture](agent-architecture.md)
- [Event system](event-system.md)
- [Phase 3](../phases/phase-03-tools-permissions.md)
- [Autonomy policy](../policies/autonomy.md)
