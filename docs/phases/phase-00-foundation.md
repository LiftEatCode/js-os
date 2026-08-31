# Phase 0 — Foundation

**Status:** Implemented (complete for foundation scope)

## Goals

Establish repository boundaries, the Next.js application shell, architecture conventions, a roadmap, and validation scripts — without adding premature agent, queue, or integration infrastructure.

## Completed work

- Repository created (`bootstrap js os`)
- Next.js 16 / React 19 / TypeScript / Tailwind application
- Generated files cleaned from Git (`.gitignore`)
- Architecture foundation documented
- Initial roadmap documented
- Project validation scripts: `typecheck`, `lint`, `build`
- Runtime pinned to Node 24 (`engines`: `>=24.0.0 <25`)
- Prisma 8 foundation: contract files, `prisma.config.ts`, `contract:emit`, no `@prisma/client`

## Key decisions

- JS OS is a separate application from JS Growth ([ADR-001](../decisions/ADR-001-separate-js-os-from-js-growth.md))
- JS Growth remains system of record for product commercial data ([ADR-002](../decisions/ADR-002-js-growth-remains-system-of-record.md))
- Prisma 8 contract architecture on PostgreSQL/Neon ([ADR-003](../decisions/ADR-003-prisma-8-contract-architecture.md))
- Infrastructure (FastAPI, queues, workers, LLM orchestration) is added only when a feature needs it — none selected in this phase

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

`contract:emit` is offline and was part of the Prisma 8 foundation.

## Remaining work

None for Phase 0. Later phases expand product capability on this foundation.
