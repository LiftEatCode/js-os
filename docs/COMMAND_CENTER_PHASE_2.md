# Phase 2 Command Center

## Purpose

`/command` is the canonical read-only operational dashboard for JS Solutions. `/app` is legacy/experimental UI pending migration and must not receive new Phase 3 capabilities.

## Data flow

`Neon / Prisma -> business-state -> getBusinessState() -> BusinessState -> /command -> CommandCenterView`

`getBusinessState()` is the single Command Center read model. It includes organization, active goals, active and blocked work, pending approvals, configured agents, recent agent runs, recent business events, and dashboard summary counts.

No Command Center component imports Prisma or a persistence adapter. Presentation code does not independently query approvals, agents, or runs.

## Panels

- Business health
- Needs attention
- Active goals
- Current work
- Agent status
- Blocked work
- Pending approvals
- Recent agent runs
- Recent business activity

## Attention rules

Attention is deterministic and ordered as:

1. blocked work
2. pending approvals
3. failed recent agent runs

There is no LLM scoring or prioritization in Phase 2.

## Phase 2.1 hardening

The hardening pass moved approvals, agents, agent runs, and their summary counts into the canonical `BusinessState` projection. `/command` now performs one business-state read and attention derivation accepts the complete snapshot. Typed fixtures replace Phase 2 `as never` domain fixtures.

## Boundary

Phase 2 is read-only. `/command` does not expose work-item mutations, approval decisions, agent execution, tool execution, policy evaluation, or AI reasoning.

Phase 3 may add governed actions, but those actions must remain separate from the read model and must target `/command`, not the legacy `/app` workspace.
