# Architecture Decision Records

ADRs record decisions that are expensive to reverse. They are not a changelog and not a design dump.

Create an ADR when JS OS chooses a boundary, a persistence strategy, an autonomy rule, or a system-of-record owner.

Do not create an ADR for routine implementation details.

## Format

```text
# ADR-NNN: Title

## Status
Accepted | Superseded | Deprecated

## Context
## Decision
## Consequences
## Alternatives considered
```

Number sequentially. Filename: `ADR-NNN-short-slug.md`.

## Index

| ADR | Decision |
|---|---|
| [ADR-001](ADR-001-separate-js-os-from-js-growth.md) | JS OS is a separate application from JS Growth |
| [ADR-002](ADR-002-js-growth-remains-system-of-record.md) | JS Growth remains canonical for product commercial data |
| [ADR-003](ADR-003-prisma-8-contract-architecture.md) | Prisma 8 contract on PostgreSQL/Neon |
| [ADR-004](ADR-004-neon-environment-isolation.md) | Isolated Neon branches; pooled vs direct URLs |
| [ADR-005](ADR-005-agent-run-audit-provenance.md) | AgentRun is audit; provenance FKs Restrict |
| [ADR-006](ADR-006-permission-and-approval-boundaries.md) | Tools + permission ceiling + approvals (intent, not implemented) |
| [ADR-007](ADR-007-atomic-business-mutation-and-event-recording.md) | Atomic command boundary for state + BusinessEvent |
