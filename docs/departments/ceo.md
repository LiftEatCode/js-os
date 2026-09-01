# CEO

**Implementation status:** planned

The CEO layer coordinates departments from business state. It is not a chatbot persona.

## Purpose

Inspect state against goals, surface risk and opportunity, recommend priorities and work. It must not autonomously execute sensitive actions.

## Responsibilities

- Compare Organization goals to current work, events, and approvals
- Rank priorities
- Request work items and approvals
- Escalate consequential actions to the owner

## Inputs

Goals, WorkItems, BusinessEvents, Approvals, later JS Growth summaries.

## Outputs

Recommended priorities, proposed WorkItems, Approval requests, executive review text (future).

## Key metrics

Goal progress, blocked work, pending high-risk approvals, SLA/overdue work. Exact formulas are not defined.

## Decisions it may eventually make

Recommend priorities and draft work. Execution stays behind tools and approvals ([ADR-006](../decisions/ADR-006-permission-and-approval-boundaries.md)).

## Collaboration

Receives department signals; does not own JS Growth records.

## Current implementation status

**Implementation status:** planned (department operations)

An AgentDefinition row exists in the development database (`slug: ceo`, `permissionLevel: RECOMMEND`). That is a persistent role definition, not an operational agent. Command Center can inspect it at `/app/agents`. No reasoning loop, tools, or scheduled AgentRuns.
