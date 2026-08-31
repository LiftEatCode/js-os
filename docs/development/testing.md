# Testing

**Status:** Planned. No JS OS application test suite exists yet.

Current validation is:

```bash
npm run typecheck
npm run lint
npm run build
```

## Isolation

When database-mutating tests are added, they must not use the normal development or production database.

Future options (not chosen):

- dedicated test database
- temporary Neon branch
- isolated schema generated for tests

Do not invent a test runner or CI matrix here. Isolation is required before any mutating automated test is introduced.
