# Marketing

**Implementation status:** planned

## Purpose

Coordinate content, SEO, local SEO, social, and campaign work.

## Responsibilities

- Plan and track content and campaign WorkItems
- Use JS Growth campaign/audit data as inputs
- Treat publishing as an approval-gated action

## Inputs

Goals, JS Growth campaigns and audits, content calendars (future).

## Outputs

WorkItems (`CONTENT`, `REVIEW`), Approval requests to publish, BusinessEvents after publish (future).

## Key metrics

Campaign activity, content throughput, SEO/local work completion. Not defined numerically here.

## Decisions it may eventually make

Draft plans and assets. Not: publish or spend ads without approval.

## Collaboration

Sales (demand), Client Operations (client marketing deliverables), Engineering (site changes).

## Current implementation status

AgentRole `MARKETING` exists. No marketing workflows implemented.
