# Approval system

**Status:** Implemented (model + persistence services). Evaluation, queues, and execution consumption are future.

An Approval is authorization for a proposed action. It is not the action itself. Later execution tooling will consume approved records.

## Why it exists

AI may recommend and prepare. JS OS decides what may run. Sensitive actions need a human decision: outbound communications, publishing, spend, production deploys, refunds.

## Shape

```text
id
organizationId
workItemId?
agentRunId?
actionType          String (not an enum)
title
description?
status
riskLevel
requestedByType
requestedById?      opaque until auth exists
requestedAt
decidedAt?
decisionReason?
expiresAt?
payload?            Jsonb — the proposed action
createdAt
updatedAt
```

- Status: `PENDING` | `APPROVED` | `REJECTED` | `CANCELLED` | `EXPIRED`
- Risk: `ApprovalRiskLevel` `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` (entity-specific)
- Requester: `USER` | `AGENT` | `SYSTEM`

No ProposedAction entity in v0.1. `payload` holds the proposed action.

## Integrity

- Organization delete: Restrict
- `agentRunId`: Restrict (optional field; if set, the run cannot be deleted)
- `workItemId`: SetNull

Approvals remain durable. Execution does not happen in this layer. `approveApproval` / `rejectApproval` / `cancelApproval` only update authorization state.

See [approval policy](../policies/approvals.md), [risk policy](../policies/risk.md), and [business-state services](business-state-services.md).
