# JS OS

Internal operating system for **JS Solutions**.

JS OS is a separate application from **JS Growth**. JS Solutions is the company. JS Growth is the customer-facing product platform (audits, prospecting, campaigns, and related commercial data). JS OS is the internal command layer: goals, business state, work, approvals, events, and later bounded AI coordination.

## Current status

**Phase 1 (Business State) is complete.** Foundation (Phase 0) is complete. **Phase 2 (Command Center) is in progress:** `/app` shell (2.1), live Overview (2.2), owner-managed Goals (2.3), owner-managed Work (2.4), read-only Activity (2.5), and owner-managed Approvals (2.6) exist. Agent *management* screens are not implemented. Company Goal, WorkItem, Approval, and BusinessEvent rows have not been populated yet. Command Center writes are disabled unless local development explicitly sets `JS_OS_COMMAND_CENTER_WRITES=true`. The Command Center is currently unauthenticated development functionality.

Stack in use: Next.js 16, React 19, TypeScript, Tailwind, Prisma 8, PostgreSQL on Neon (isolated development and production branches).

## Core principle

AI may recommend and prepare actions. JS OS controls what is permitted to execute. Integrations and autonomous actions must pass through explicit tools, permission rules, and approvals. Tool execution is **not implemented**.

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
