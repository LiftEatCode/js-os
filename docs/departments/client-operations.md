# Client Operations

**Implementation status:** planned

## Purpose

Coordinate client deliverables, reporting, health, and growth opportunities.

## Responsibilities

- Track delivery WorkItems (`CLIENT_WORK`)
- Surface overdue or blocked client work
- Route growth opportunities back to Sales/Marketing without copying JS Growth objects

## Inputs

WorkItems, Goals, future client-health signals. Canonical prospect/client product data stays in JS Growth where it already lives.

## Outputs

Delivery WorkItems, health-related BusinessEvents, handoff WorkItems to other departments.

## Key metrics

Overdue work, delivery completion, client-health flags (undefined until data exists).

## Decisions it may eventually make

Reprioritize delivery queue. Not: send client-facing reports without approval policy.

## Collaboration

Sales (new clients), Marketing (retainers), Engineering (site issues), Finance (billing later).

## Current implementation status

**Implementation status:** planned (department operations)

An AgentDefinition row exists in the development database (`slug: client-operations`, `permissionLevel: RECOMMEND`). That is a role definition, not an operational client-ops agent. No client ops UI.
