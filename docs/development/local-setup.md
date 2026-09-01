# Local setup

**Status:** Implemented for the Next.js + Prisma 8 foundation.

## Requirements

- **Node 24** (`package.json` engines: `>=24.0.0 <25`)
- **npm** (this repo’s package manager)

Prisma 8 requires Node 24. Do not use Node 22 as the project runtime.

## Environment file

Copy `.env.example` to `.env.local`. Fill pooled and direct Neon URLs for the **development** branch only.

```text
DATABASE_URL=                    pooled runtime connection
DIRECT_URL=                      direct Prisma CLI/admin connection
JS_OS_COMMAND_CENTER_WRITES=false  temporary write safeguard; set true only for local `next dev`
```

Do not commit `.env.local`. Do not paste real credentials into documentation or `NEXT_PUBLIC_*` variables.

Prisma CLI (`prisma.config.ts`) loads `.env.local` and uses `DIRECT_URL`. Application runtime (`src/prisma/db.ts`) uses `DATABASE_URL` and loads the Temporal polyfill. Business-state services import that client.

## Install and run

```bash
npm install
npm run dev
```

The app landing page is `/`. The Command Center is `/app`. Auth is not implemented.

Goal, WorkItem, Approval, and Agent configuration mutations are Server Actions. They succeed only when `NODE_ENV` is `development` and `.env.local` contains `JS_OS_COMMAND_CENTER_WRITES=true`. Leave the flag false unless you are entering real JS Solutions operating state. Do not create placeholder rows. Approving an Approval authorizes a proposal; it does not execute it. Changing an AgentDefinition does not start a run. Goal and Work commands append BusinessEvents in the same transaction as the state change.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

Development read-only service check (uses Neon development; does not write):

```bash
npm run business-state:verify
```

Development tool request/execution lifecycle check (writes then deletes rows; development Neon only):

```bash
npm run tool-lifecycle:verify
```

After editing `src/prisma/contract.prisma`:

```bash
npm run contract:emit
```

`contract:emit` is offline. It does not need a database.

Development business-state bootstrap (not a migration; development only):

```bash
npm run db:bootstrap
```

Schema changes against Neon: [database workflow](database-workflow.md). Never apply a migration before reviewing its plan. Never point local setup at production.
