# Testing

**Status:** In progress (unit tests for service helpers). Isolated database tests are not implemented.

Current validation:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

`npm test` runs Node's built-in test runner against:

- `src/business-state/validation.test.ts` (event-type format, approval/AgentRun lifecycle rules)
- `src/business-state/goal-lifecycle.test.ts` (`completedAt` when entering/leaving `ACHIEVED`)
- `src/command-center/overview/attention.test.ts` (Owner Attention projection)
- `src/command-center/write-access.test.ts` (writes disabled by default; development + explicit opt-in)
- `src/command-center/goals/ordering.test.ts` (Goal list ordering)
- `src/command-center/goals/parse.test.ts` (form parsing, enums, decimal strings)
- `src/business-state/work-item-lifecycle.test.ts` (`startedAt` / `completedAt`; CANCELLED is not completion)
- `src/business-state/work-item-hierarchy.test.ts` (self-parent and descendant cycle rejection)
- `src/business-state/approval-lifecycle.test.ts` (PENDING transitions, decidedAt, rejection reason, past expiration is not EXPIRED)
- `src/business-state/agent-definition-lifecycle.test.ts` (status/permission no-op rejection)
- `src/command-center/work/ordering.test.ts` (WorkItem list ordering)
- `src/command-center/work/parse.test.ts` (Work form parsing, enums, due dates)
- `src/command-center/activity/format.test.ts` (event/source labels, filters, metadata JSON)
- `src/command-center/approvals/ordering.test.ts` (pending/risk/requestedAt list ordering)
- `src/command-center/approvals/parse.test.ts` (request/decision parsing, JSON payload, filters)
- `src/business-commands/command.test.ts` (mutation+event commit/rollback pairing; no Neon)
- `src/business-commands/approvals.test.ts` (atomic Approval+event commands, duplicate-decision protection; no Neon)
- `src/business-commands/agents.test.ts` (atomic AgentDefinition status/permission + event; no-ops; other-org; rollback; no Neon)
- `src/command-center/agents/ordering.test.ts` (role and permission hierarchy; AgentRun recency)
- `src/command-center/agents/parse.test.ts` (filters, status/permission forms, EXECUTE confirmation)
- `src/knowledge/source.test.ts` (discovery, slugs, titles, ordering, exclusions, path safety, links, search)
- `src/knowledge/markdown-render.test.ts` (headings, lists, code, tables; no raw HTML execution)

These tests do not connect to a database. Knowledge tests use fixture Markdown under `src/knowledge/fixtures/`. Do not mutate Neon from automated tests.

## Development verification

Read-only check of bootstrapped development state through the service layer:

```bash
npm run business-state:verify
```

## Isolation

When database-mutating tests are added, they must not use the normal development or production database.

Future options (not chosen):

- dedicated test database
- temporary Neon branch
- isolated schema generated for tests

Do not invent a risky integration-test architecture until isolation exists. Do not wipe or truncate the development database from tests.
