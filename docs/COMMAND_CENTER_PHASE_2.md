# Phase 2 Command Center

## Purpose

`/command` is the read-only operational dashboard for JS Solutions. Its primary source is the normalized `getBusinessState()` snapshot from `src/business-state`.

## Data flow

`Neon / Prisma -> business-state -> getBusinessState() -> command loader -> CommandCenterView`

The loader supplements the snapshot with approvals, configured agents, and recent agent runs through the existing business-state public API because those collections are not yet part of `BusinessState`.

No Command Center component imports Prisma or a persistence adapter.

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

## Boundary

Phase 2 is read-only. `/command` does not expose work-item mutations, approval decisions, agent execution, tool execution, policy evaluation, or AI reasoning.

The existing `/app` workspace remains available while `/command` establishes the snapshot-first Command Center architecture.
