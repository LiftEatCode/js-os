# Approval policy

**Status:** Designed (model and Command Center implemented). Tool evaluation, execution, and enforcement are planned for Phase 3; not implemented.

An Approval authorizes a proposed action. It does not perform the action.

## Existing model

The Approval entity records:

- what is proposed (`actionType`, title, `payload`)
- risk (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
- who requested it (`USER` | `AGENT` | `SYSTEM`)
- decision (`PENDING` | `APPROVED` | `REJECTED` | `CANCELLED` | `EXPIRED`)

Details: [approval system](../architecture/approval-system.md).

## Rules

1. Approval is authorization, not execution. Later tooling consumes an `APPROVED` record and then executes.
2. High-risk and consequential actions should require owner approval. Examples already established:
   - external communications
   - publishing content
   - spending money
   - production deployments
   - refunds
3. Future tooling will evaluate whether a tool request needs an Approval. The Phase 3 design is static `NEVER` / `ALWAYS` on the tool definition ([tool architecture](../architecture/tool-architecture.md)). That evaluator is not implemented.
4. An `EXECUTE` permission level does not skip this policy.

Do not invent numeric spend thresholds or a complete `actionType` catalog here. Those belong with tools.

See [risk policy](risk.md) and [ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md).
