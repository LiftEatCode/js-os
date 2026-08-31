# Testing

**Status:** In progress (unit tests for service helpers). Isolated database tests are not implemented.

Current validation:

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

`npm test` runs Node's built-in test runner against `src/business-state/validation.test.ts` (event-type format, approval/AgentRun lifecycle rules). It does not connect to a database.

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
