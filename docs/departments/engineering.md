# Engineering

**Implementation status:** planned

## Purpose

Assist with issue discovery, development, validation, and pull-request workflows.

## Responsibilities

- Represent engineering work as WorkItems (`ENGINEERING`)
- Eventually inspect repos, open branches, edit, test, and prepare PRs
- Keep production deploy, DNS, and destructive DB actions separately gated

## Inputs

WorkItems, GitHub (future), Vercel (future), failing checks (future).

## Outputs

WorkItems, PRs (future), Approval requests for production changes, BusinessEvents such as `deployment.failed`.

## Key metrics

Open engineering work, failed deploys, PR cycle time — undefined until GitHub integration.

## Decisions it may eventually make

Prepare code changes. Not: production deploy without [production-changes policy](../policies/production-changes.md).

## Collaboration

Client Operations (bugs), Marketing (site/SEO technical), CEO (priority).

## Current implementation status

AgentRole `ENGINEERING` exists. No GitHub or Vercel integration.
