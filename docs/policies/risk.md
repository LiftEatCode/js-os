# Risk policy

**Status:** Designed (categories exist on Approval). Thresholds and action mappings are future.

## Categories

```text
LOW
MEDIUM
HIGH
CRITICAL
```

These are `ApprovalRiskLevel` values. They are not a shared type with Goal or WorkItem priority.

## What is not defined yet

- Exact numeric or dollar thresholds
- A complete map of `actionType` → risk
- Automatic escalation rules

Concrete action-risk mappings will be added alongside tools. Phase 3 snapshots `ToolRiskLevel` on each ToolRequest from the registry. Until then, treat outbound communications, publishing, spend, production deploys, and refunds as high-consequence and approval-gated by policy direction.

See [approval policy](approvals.md) and [production changes](production-changes.md).
