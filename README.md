# JS OS

Internal operating system for **JS Solutions**.

JS OS is a separate application from **JS Growth**. JS Solutions is the company. JS Growth is the customer-facing product platform (audits, prospecting, campaigns, and related commercial data). JS OS is the internal command layer: goals, business state, work, approvals, events, and later bounded AI coordination.

## Current status

**Phase 1 (Business State) is complete.** Foundation (Phase 0) is complete. **Phase 2 (Command Center) is complete.** **Phase 3 (Tools + Permissions) is in progress:** 3.1 persistence and 3.2 code registry. There is no permission evaluator or `/app/tools` UI yet. Command Center writes are disabled unless local development explicitly sets `JS_OS_COMMAND_CENTER_WRITES=true`. The Command Center is currently unauthenticated development functionality.

Stack in use: Next.js 16, React 19, TypeScript, Tailwind, Prisma 8, PostgreSQL on Neon (isolated development and production branches).

## Core principle

AI may recommend and prepare actions. JS OS controls what is permitted to execute. Integrations and autonomous actions must pass through explicit tools, permission rules, and approvals. Tool execution runtime is **not implemented**; request/attempt tables exist as of Phase 3.1.

## Documentation

**Start here:** [docs/README.md](docs/README.md)

That index covers architecture, company context, departments, policies, operations, integrations, development, ADRs, and the roadmap.

## Development

Requires **Node 24**. Copy `.env.example` to `.env.local` (development Neon URLs only). Do not commit secrets.

```bash
npm install
npm run dev
```

Validation:

```bash
npm run typecheck
npm run lint
npm run build
```

Prisma contract (offline):

```bash
npm run contract:emit
```

Development bootstrap (not a migration; development only):

```bash
npm run db:bootstrap
```

Read-only service verification (development):

```bash
npm run business-state:verify
```

Never apply a database migration before reviewing its plan. Never point development at production. Details: [docs/development/local-setup.md](docs/development/local-setup.md).
