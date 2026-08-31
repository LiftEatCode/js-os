# Sales

**Implementation status:** planned

## Purpose

Coordinate prospecting and sales using JS Growth capabilities, not a second CRM.

## Responsibilities

- Turn JS Growth leads/prospects/opportunities into JS OS WorkItems
- Keep follow-up visible in the work queue
- Request outreach only through future tools + approvals

## Inputs

JS Growth prospects, leads, opportunities, audits. JS OS Goals and WorkItems.

## Outputs

WorkItems (`OUTREACH` / `TASK`), BusinessEvents such as `lead.created` (when integrated), Approval requests for outbound messages.

## Key metrics

Pipeline movement, conversion, overdue follow-up. Metrics will be defined when JS Growth integration exists.

## Decisions it may eventually make

Prioritize which prospects to work. Not: send email without approval policy.

## Collaboration

CEO (priorities), Marketing (campaigns), Client Operations (handoff after close).

## Current implementation status

AgentRole `SALES` exists. No sales UI or JS Growth connection.
