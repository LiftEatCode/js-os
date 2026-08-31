# Architecture overview

**Status:** Implemented through Phase 1. Command Center shell (2.1) and live Overview (2.2) are implemented. Later Command Center milestones and later phases are planned.

JS OS is the internal operating system for JS Solutions. It is the orchestration and command platform for business operations across sales, marketing, client operations, engineering, finance, and AI-assisted workflows.

It is a separate application from [JS Growth](../integrations/js-growth.md). See [system boundaries](system-boundaries.md).

## Purpose

JS OS will provide one place to understand business state, set priorities, coordinate work, approve actions, and eventually allow specialized AI agents to perform bounded operations.

## Current implemented architecture

**Status:** Implemented

```text
Next.js 16
React 19
TypeScript
Tailwind CSS
Prisma 8 contract (PSL)
PostgreSQL on Neon
```

What exists now:

- Phase 1 business-state contract in `src/prisma/contract.prisma`
- Emitted artifacts `src/prisma/contract.json` and `src/prisma/contract.d.ts`
- Runtime client `src/prisma/db.ts` used by business-state services
- Isolated Neon development and production branches
- Pooled runtime URL (`DATABASE_URL`) and direct CLI URL (`DIRECT_URL`)
- Local secrets in gitignored `.env.local`
- Development bootstrap: JS Solutions Organization + six AgentDefinition role rows
- Business-state service layer (`src/business-state`, import `@/business-state`)
- Temporal polyfill in `src/prisma/db.ts` for Prisma 8 timestamptz codecs
- Command Center shell and navigation at `/app` (Milestone 2.1)
- Live read-only Command Center Overview (Milestone 2.2)

What does not exist yet:

- Command Center feature screens (Milestones 2.3–2.8)
- Goal rows (deferred operating-state population, not unfinished schema)
- Tools, permissions enforcement, or tool execution
- CEO review loop
- Integrations
- Auth / organization membership
- FastAPI, queues, workers, or a chosen agent orchestration framework

## Conceptual operating flow

**Status:** Planned (CEO review and execution are future)

```text
Goals
  ↓
Business State
  ↓
CEO Review
  ↓
Priorities
  ↓
Work Items
  ↓
Approvals
  ↓
Execution
  ↓
Business Events
  ↓
Updated Business State
```

Long-term coordination model:

```text
Owner
  ↓
JS OS CEO
  ↓
Department coordination
  ↓
Tools / permissions / approvals
  ↓
Execution
  ↓
Business events
  ↓
Updated business state
```

## Architectural layers

| Layer | Role | Status |
|---|---|---|
| Command Center | Internal operating UI | In progress (2.1 shell, 2.2 overview) |
| Business state | Durable goals, work, events, approvals, agents | Implemented (contract + services) |
| Reasoning | CEO/department review of state vs goals | Planned |
| Tools | Explicit execution boundary | Future |
| Permissions | Autonomy ceiling plus per-tool checks | Designed, not enforced |
| Approvals | Authorization for proposed actions | Implemented (model + persistence; evaluation future) |
| Execution | Performing an approved action | Future |
| Events | Append-oriented timeline | Implemented (model + append API) |

## Principles

1. **Business state before agents.** Agents operate from durable records, not chat history alone.
2. **Tools are the execution boundary.** Agents do not get unrestricted access to services or mutations.
3. **Permission-aware actions.** Observe, recommend, prepare, execute. `AgentDefinition.permissionLevel` is a ceiling, not a blanket grant.
4. **Human approval where appropriate.** External communications, publishing, spend, production deploys, and refunds require approval.
5. **Auditability.** Agent runs record trigger, input snapshot, result, errors, and timestamps. Tool request/execution history is future.
6. **Incremental autonomy.** Start as decision-support. Increase autonomy only after workflows are reliable.

## Core control principle

AI may recommend and prepare actions. JS OS controls what is permitted to execute.

All future integrations and autonomous actions must pass through explicit tools and permission rules.

## Related

- [System boundaries](system-boundaries.md)
- [Business state](business-state.md)
- [Business-state services](business-state-services.md)
- [Command Center](command-center.md)
- [Database](database.md)
- [Roadmap](../roadmap.md)
