# Database workflow

**Status:** Implemented for Prisma 8 contract + development migrations.

Do not use Prisma 7 commands (`prisma migrate dev`, `prisma generate` against `schema.prisma`, `@prisma/client`) as the default path.

## Connection split

```text
DATABASE_URL  → pooled Neon URL → application runtime (src/prisma/db.ts)
DIRECT_URL    → direct Neon URL → Prisma CLI (prisma.config.ts)
```

CLI operations must use the development branch locally.

## Standard sequence

```bash
npm run contract:emit
npx prisma@latest migration plan --name <name>
npx prisma@latest db migrate
npx prisma@latest db verify
npx prisma@latest migration list
```

| Step | Role | Database |
|---|---|---|
| `npm run contract:emit` | Regenerate `contract.json` / `contract.d.ts` from `contract.prisma` | **Offline.** Does not connect. |
| `migration plan --name <name>` | Produce a reviewable plan from the contract change | Review this output. Do not skip it. |
| `db migrate` | Apply a reviewed plan | **Mutates** the connected database. Development only unless production migrate is an explicit ops step. |
| `db verify` | Check the database against the contract | Connects; does not replace migrate. |
| `migration list` | Show migration history | Inspects migration state. |

**Never apply a migration before reviewing its plan.**

Application request handling must not run schema-management commands (`db init`, `db update`, `db migrate`, `db sign`).

Do not use `prisma db push` as the normal production strategy.

## Business-state bootstrap

**Status:** Implemented (development only)

Foundational JS Solutions rows (not disposable demo seed):

```bash
npm run db:bootstrap
```

Creates missing rows only:

```text
1 Organization   slug js-solutions
6 AgentDefinitions
  ceo, sales, marketing, client-operations, engineering, finance
```

Does not create Goals, WorkItems, Approvals, AgentRuns, or BusinessEvents. Does not delete or truncate.

> Bootstrap establishes missing foundational records. It does not continuously enforce mutable operating configuration.

Safe to run more than once:

- Missing org/agent rows are created with initial defaults.
- Existing rows are left unchanged (`status`, `permissionLevel`, `instructions`, `description`, and other mutable fields are preserved).
- Identity drift fails loudly (Organization `js-solutions` with an unexpected name, or a known agent slug with an unexpected `role`) instead of being silently rewritten.

Safety:

- Script requires `JS_OS_BOOTSTRAP_TARGET=development` (`npm run db:bootstrap` sets this).
- Refuses `NODE_ENV=production` and hosts that look like production.
- Prints host and database name only — never connection strings or passwords.
- Neon endpoint names do not always include the branch word “development”, so the host printout must be confirmed as the development branch.
- Production bootstrap is not supported.

Uses `DATABASE_URL` (pooled runtime). Node 24 CLI scripts that write `timestamptz` defaults need `--harmony-temporal` (included in the npm script) because Prisma 8 `instantNow` requires Temporal.

Details of the rows: [business state](../architecture/business-state.md), [agent architecture](../architecture/agent-architecture.md).

## Source of truth

```text
src/prisma/contract.prisma
src/prisma/contract.json      (generated, committed)
src/prisma/contract.d.ts      (generated, committed)
migrations/                   (committed)
```

Do not hand-edit generated contract artifacts.

Initial development migration: `migrations/app/20260831T1616_initial_business_state`.

Details: [database architecture](../architecture/database.md).
