# JS OS

JS OS is the internal operating system for JS Solutions. It coordinates company state, goals, work, business events, approvals, agents, tools, and command-center workflows.

The project intentionally keeps JS Growth / JS Solutions customer-facing systems separate from JS OS. JS Growth owns customer-facing workflows and source business data; JS OS consumes normalized business events and turns them into operating state, priorities, and coordinated work.

## Current foundation

- Business-state contract and Prisma 8 / Neon persistence
- JS Solutions organization bootstrap
- Goals, WorkItems, BusinessEvents, approvals, agent definitions, and agent runs
- `getBusinessState()` normalized operating snapshot
- Command Center surfaces
- Tool request / execution lifecycle
- Authenticated JS Growth event ingestion for high-value business outcomes

## JS Growth integration

JS OS accepts server-to-server business events at:

`POST /api/integrations/js-growth/events`

The v1 integration currently accepts:

- `growth.quote_submitted`
- `growth.audit_completed`

Requests require the server-only `JS_GROWTH_EVENTS_SECRET` bearer secret. Events are stored as `BusinessEvent` rows with `sourceType = JS_GROWTH` and use the publisher `eventId` as `sourceId` for idempotency.

## Development

Use Node 24 and configure `.env.local` from `.env.example`.

```bash
npm install
npm run typecheck
npm test
npm run build
```

Business-state bootstrap and verification target the Neon development branch only:

```bash
npm run db:bootstrap
npm run business-state:verify
npm run js-growth-ingestion:verify
```

After changing `src/prisma/contract.prisma`, emit the contract and create/review/apply the corresponding Prisma migration before relying on the new database constraint in a shared environment.
