# ADR-001: Separate JS OS from JS Growth

## Status

Accepted

## Context

JS Solutions needs an internal operating layer for goals, work, approvals, and eventually bounded AI. JS Growth already exists as a customer-facing product platform with audits, prospecting, campaigns, and related commercial data.

Mixing internal company operations into JS Growth would couple product delivery to company command. Duplicating JS Growth inside JS OS would split the system of record.

## Decision

JS OS is a separate application and repository. JS Solutions is the company. JS Growth is the product platform. JS OS is the internal operating system.

JS OS has its own database. Integration happens through APIs and tools, not shared tables or cross-database joins.

## Consequences

- Two codebases, two databases, independent deploys
- JS OS can evolve command, approvals, and agents without product-schema churn
- Integrations must be explicit and will take longer than a shared database
- WorkItems may reference JS Growth records by `sourceType` / `sourceId` only

## Alternatives considered

- Build command features inside JS Growth: rejected; product and company OS have different users and risk.
- One shared database: rejected; accidental coupling and production-risk bleed.
