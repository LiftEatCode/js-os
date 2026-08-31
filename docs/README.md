# JS OS documentation

This is the documentation home for JS OS.

JS OS is the internal operating system for JS Solutions. It is a separate application from JS Growth. Documentation is a first-class part of the system: human institutional knowledge now, and later machine-readable operating knowledge for agents.

**Status labels** used throughout:

```text
Implemented
In progress
Planned
Future
Draft operating definition
```

Do not treat Planned/Future text as shipped capability.

---

## Architecture

| Document | Purpose |
|---|---|
| [Overview](architecture/overview.md) | What JS OS is, current stack, conceptual operating flow, layers. |
| [System boundaries](architecture/system-boundaries.md) | JS Solutions vs JS Growth vs JS OS; what each owns. |
| [Database](architecture/database.md) | PostgreSQL, Neon, Prisma 8, connections, isolation. |
| [Business state](architecture/business-state.md) | Phase 1 entities, locked decisions, referential integrity. |
| [Business-state services](architecture/business-state-services.md) | Typed access layer over the seven Phase 1 models. |
| [Event system](architecture/event-system.md) | BusinessEvent as append-oriented timeline. |
| [Agent architecture](architecture/agent-architecture.md) | AgentDefinition vs AgentRun; permission ceiling. |
| [Tool architecture](architecture/tool-architecture.md) | Future execution boundary; not implemented. |
| [Approval system](architecture/approval-system.md) | Approval authorizes; it does not execute. |
| [Command Center](architecture/command-center.md) | Internal operating UI: routes, navigation, Goals, implemented vs planned. |
| [Integrations (architecture)](architecture/integrations.md) | How JS OS will talk to other systems without duplicating them. |

Compatibility pointers (old paths): [architecture.md](architecture.md), [database.md](database.md), [data-model.md](data-model.md).

---

## Company

Strategic context for JS Solutions. Mission, vision, values, and goals are **draft operating definitions** unless later formally approved.

| Document | Purpose |
|---|---|
| [Company overview](company/company-overview.md) | Company vs product vs OS. |
| [Mission](company/mission.md) | Draft direction JS OS should optimize toward. |
| [Vision](company/vision.md) | Draft end-state operating model. |
| [Values](company/values.md) | Draft design values (state, tools, approvals). |
| [Services](company/services.md) | Service areas in operating scope. |
| [Business model](company/business-model.md) | Services + JS Growth; no invented pricing. |
| [Target market](company/target-market.md) | Who the company serves at a high level. |
| [Strategic goals](company/strategic-goals.md) | Draft goal *kinds* until seeded Goal rows exist. |

---

## Departments

Future operating definitions. Department **operations** are planned. AgentDefinition role rows exist in development; that is not an operational agent.

| Document | Purpose |
|---|---|
| [CEO](departments/ceo.md) | Coordinate departments from business state. |
| [Sales](departments/sales.md) | Prospecting/sales via JS Growth, not a second CRM. |
| [Marketing](departments/marketing.md) | Content, SEO, campaigns. |
| [Client Operations](departments/client-operations.md) | Delivery and client health. |
| [Engineering](departments/engineering.md) | Issues, development, PRs; production separately gated. |
| [Finance](departments/finance.md) | Money movement; not the ledger yet. |

---

## Policies

| Document | Purpose |
|---|---|
| [Autonomy](policies/autonomy.md) | OBSERVE / RECOMMEND / PREPARE / EXECUTE; ceiling vs tools. |
| [Approvals](policies/approvals.md) | Authorization vs execution; consequential actions. |
| [Risk](policies/risk.md) | LOW–CRITICAL categories; no invented thresholds. |
| [Data access](policies/data-access.md) | Credentials, server-side access, isolation. |
| [Client data](policies/client-data.md) | Pointers vs copies; JS Growth remains canonical. |
| [Communications](policies/communications.md) | Outbound messages are approval-gated. |
| [Production changes](policies/production-changes.md) | Prepare PRs vs gated production/DNS/DB. |

---

## Operations

Future operating rhythms. No scheduler exists.

| Document | Purpose |
|---|---|
| [Daily cycle](operations/daily-cycle.md) | Health, priorities, pipeline, deadlines, failures, approvals. |
| [Weekly cycle](operations/weekly-cycle.md) | Sales, marketing, delivery, cash, goals. |
| [Monthly cycle](operations/monthly-cycle.md) | Revenue, conversion, service performance. |
| [Quarterly cycle](operations/quarterly-cycle.md) | Strategy, pricing, portfolio, allocation. |
| [Exception management](operations/exception-management.md) | Break-glass events → WorkItem / Approval. |

---

## Integrations

None are implemented. JS Growth is specified in most detail because the boundary is already decided.

| Document | Purpose |
|---|---|
| [JS Growth](integrations/js-growth.md) | Canonical product/CRM data; orchestration later. |
| [GitHub](integrations/github.md) | Engineering work pointers and future PR tooling. |
| [Email](integrations/email.md) | Draft/send through tools + approval. |
| [Calendar](integrations/calendar.md) | Deadlines and meetings as inputs. |
| [Payments](integrations/payments.md) | Money events; spend/refund gated. |
| [Vercel](integrations/vercel.md) | Deploy observation; production separately gated. |

---

## Development

| Document | Purpose |
|---|---|
| [Local setup](development/local-setup.md) | Node 24, npm, env files, install, validation. |
| [Environments](development/environments.md) | Dev vs production Neon; preview future. |
| [Database workflow](development/database-workflow.md) | Prisma 8 plan-then-migrate; URL split; development bootstrap. |
| [Testing](development/testing.md) | Unit tests for service helpers; no isolated DB tests yet. |
| [Deployment](development/deployment.md) | Intended Vercel hosting; not a live claim. |

---

## Architecture Decision Records

How ADRs work and the accepted decisions: [decisions/README.md](decisions/README.md).

| ADR | Decision |
|---|---|
| [ADR-001](decisions/ADR-001-separate-js-os-from-js-growth.md) | JS OS is a separate application from JS Growth. |
| [ADR-002](decisions/ADR-002-js-growth-remains-system-of-record.md) | JS Growth remains canonical for product commercial data. |
| [ADR-003](decisions/ADR-003-prisma-8-contract-architecture.md) | Prisma 8 contract on PostgreSQL/Neon. |
| [ADR-004](decisions/ADR-004-neon-environment-isolation.md) | Isolated Neon branches; pooled vs direct URLs. |
| [ADR-005](decisions/ADR-005-agent-run-audit-provenance.md) | AgentRun is audit; provenance FKs Restrict. |
| [ADR-006](decisions/ADR-006-permission-and-approval-boundaries.md) | Tools + permission ceiling + approvals (intent, not enforced). |

---

## Phase history / roadmap

| Document | Purpose |
|---|---|
| [Roadmap](roadmap.md) | Phases 0–15: objective, capabilities, safety, exit criteria. |
| [Phase 0 — Foundation](phases/phase-00-foundation.md) | Repo, Next.js, architecture, Node 24, Prisma 8 foundation. |
| [Phase 1 — Business State](phases/phase-01-business-state.md) | Contract, Neon, bootstrap, service layer. Complete; Goal rows later. |
| [Phase 2 — Command Center](phases/phase-02-command-center.md) | Shell, live Overview, and Goal management; later screens planned. |
