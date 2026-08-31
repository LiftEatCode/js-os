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
