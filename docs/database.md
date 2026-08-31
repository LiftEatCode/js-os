# JS OS Database Architecture

## Purpose

This document defines the database foundation for JS OS Phase 1.

Prisma ORM 8 is now installed as project infrastructure. The JS OS business models have not been translated yet. The v0.1 domain model remains in `docs/data-model.md` and will be implemented in a later dedicated step.

```text
No database has been initialized, verified, signed, or migrated yet.
```

Do not treat this file as a live database. There is no Neon project, no connection string, no `db init`, no `db sign`, and no migrations.

---

## Database direction

```text
Database: PostgreSQL
Provider: Neon
ORM: Prisma ORM 8
```

Why:

- PostgreSQL is a strong fit for relational business state: organizations, goals, work items, approvals, events, and agent runs have explicit relationships and statuses.
- Prisma 8 is the current Prisma ORM line. JS OS is pinned to Node 24, which Prisma 8 requires.
- This is a new internal system with no legacy Prisma 7 implementation to preserve.
- Neon provides managed PostgreSQL and works well with serverless Next.js deployments on Vercel.
- JS OS should have its own database rather than sharing JS Growth's database.
- Cross-system integration with JS Growth should happen through APIs and integration boundaries, not direct table coupling.

JS Growth already uses PostgreSQL/Neon. JS OS follows a similar stack for operational familiarity, but the databases remain independent.

This does not add FastAPI, queues, workers, or LLM infrastructure. Those wait until a later feature requires them.

---

## Prisma 8 status

Installed as a foundation only:

- CLI: `prisma@8.0.0-rc.10`
- Postgres adapter: `@prisma/orm-postgres@8.0.0-rc.8`
- CLI engine: `@prisma/cli-engine@0.2.3`

Prisma 8 is contract-first. It uses a newer workflow than Prisma 7 (`schema.prisma` + `@prisma/client` + `prisma migrate`):

```text
contract
emit
db init
db verify
db sign
```

Current project state:

```text
contract source: src/prisma/contract.prisma
emitted artifacts: src/prisma/contract.json, src/prisma/contract.d.ts
runtime client: src/prisma/db.ts (unused by the Next.js app)
CLI config: prisma.config.ts
```

The starter User/Post sample models were removed. The contract is empty on purpose until `docs/data-model.md` is translated.

```text
No database has been initialized, verified, signed, or migrated yet.
```

Do not run `db init`, `db verify`, `db sign`, `db push`, `contract infer`, or `--probe-db` until a dedicated Neon database exists.

---

## Isolation principle

> Development, preview, test, and production database activity must be isolated. No development command, migration experiment, seed script, automated test, or preview deployment should be capable of mutating the production database.

Environment separation is a safety boundary, not just convenience.

JS OS will store goals, work, approvals, business events, and agent runs. Accidental writes to production would corrupt operating state and audit history.

Normal application request handling must not perform schema-management operations (`db init`, `db update`, `db migrate`, `db sign`). Those are CLI/ops paths only.

---

## Environment strategy

Three logical environments:

```text
Local Development
Preview / Staging
Production
```

### Local Development

Use a dedicated Neon development database or development branch.

Do not use the production database for local development.

Local secrets belong in `.env` or `.env.local` (gitignored). `.env.example` documents empty placeholders only:

```text
DATABASE_URL=
DIRECT_URL=
```

### Preview / Staging

Vercel Preview deployments should use a non-production database.

Long-term Preview strategy remains isolated Neon branches.

Preview environments must never point at production credentials.

### Production

Production Vercel deployments use the production JS OS database only.

Production credentials should exist only in production environment configuration.

Production database operations must remain controlled.

---

## Database ownership

JS OS owns its own database.

Examples of data JS OS will eventually own:

```text
Organization
Goal
WorkItem
BusinessEvent
Approval
AgentDefinition
AgentRun
```

Those models are not in the Prisma contract yet.

JS OS should not directly own or duplicate canonical JS Growth records such as:

```text
Prospect
Lead
Campaign
Website Audit
GBP Audit
Opportunity
Competitive Intelligence
```

Those remain canonical in JS Growth.

---

## Cross-system data

> JS OS may cache or snapshot external data when required for decision-making or auditing, but the source system remains canonical unless ownership is explicitly transferred.

Examples:

A JS OS WorkItem can reference:

```text
sourceType = JS_GROWTH
sourceId = <external record id>
```

A future integration service may fetch the current record from JS Growth.

Do not design the JS Growth API in this document.

This matches `docs/data-model.md`: `sourceType` / `sourceId` are for external or integration-origin references. Core JS OS relationships use dedicated foreign keys.

```text
JS OS DB               JS Growth DB
    │                        │
    └──── API/Integration ───┘
```

> JS OS and JS Growth must not rely on direct cross-database joins.

---

## Prisma strategy

Prisma 8 is installed. Do not add `@prisma/client` or other Prisma 7 packages.

The first real schema should be generated from `docs/data-model.md`, including the v0.1 decisions:

- entity-specific enums
- optional `WorkItem.agentRunId`
- no WorkItem JSON metadata
- no Goal hierarchy
- `Approval.payload` instead of a ProposedAction entity
- JSON candidates limited to `BusinessEvent.metadata`, `Approval.payload`, `AgentRun.inputSnapshot`, and `AgentRun.output`

---

## Prisma generation

Prisma Client generation in Prisma 8 is `contract emit`.

Current script:

```json
"contract:emit": "prisma contract emit"
```

`contract emit` is offline. It does not need a database connection.

After the JS OS models are authored, changing `src/prisma/contract.prisma` requires re-running `npm run contract:emit`.

---

## Database workflow (not run yet)

Prisma 8 does not use Prisma 7 `prisma migrate dev` / `prisma migrate deploy` as the default path.

Intended later workflow:

### Development

1. Edit `src/prisma/contract.prisma`
2. `npm run contract:emit`
3. Against the **development** database only, use Prisma 8 database commands such as `db init` (first time) or the documented update/migration commands

Development commands must run only against the development database.

### Production

Production schema changes should use committed migration artifacts once that workflow is introduced.

Do not use:

```bash
prisma db push
```

Prisma 8 does not treat `db push` as the production schema-management strategy. Direct schema push must not replace committed history.

```text
No database has been initialized, verified, signed, or migrated yet.
```

---

## Contract and migration source of truth

Until JS OS models exist, `docs/data-model.md` remains the domain source of truth.

After models are translated, the Prisma 8 source of truth will be:

```text
src/prisma/contract.prisma
+
src/prisma/contract.json
src/prisma/contract.d.ts
+
future committed migrations
```

`contract.json` and `contract.d.ts` are generated by `contract emit` and should be committed. Do not edit them by hand.

All production schema changes should be represented by committed migrations once that workflow is enabled.

---

## Direct URL vs pooled URL

Neon may expose both pooled and direct database connections.

Documented future convention:

```text
DATABASE_URL
DIRECT_URL
```

Meaning:

- `DATABASE_URL` is the pooled Neon connection for JS OS application runtime (`src/prisma/db.ts`).
- `DIRECT_URL` is the direct Neon connection for Prisma CLI/database-management operations where required.

The generated Prisma 8 `prisma.config.ts` currently uses `DATABASE_URL` for the CLI `db.connection` value. The installed Prisma 8 skill and scaffold document `DATABASE_URL` as the single config/runtime variable. They do not document a `DIRECT_URL` split.

JS OS therefore keeps the generated `DATABASE_URL` wiring for now:

- Changing the CLI datasource to `DIRECT_URL` would be a Prisma 7/Neon assumption, not a Prisma 8-documented default.
- `DIRECT_URL` is not set locally, so pointing the CLI at it now would break offline validation without inventing credentials.

Exact Neon pooled vs direct mapping remains an open implementation decision for when the Neon project is created.

Do not put real credentials or hostnames in this repository's documentation.

---

## Seeding strategy

JS OS will eventually need deterministic development seed data.

Initial likely seed records:

```text
Organization: JS Solutions

AgentDefinitions:
- CEO
- Sales
- Marketing
- Client Operations
- Engineering
- Finance

Initial Goals:
- a small set of example active goals
```

Do not implement the seed script yet.

Production seeding must not blindly insert demo or example data.

---

## Testing database strategy

Automated tests that mutate a database must not use the normal production or development database.

Future options include:

- dedicated test database
- temporary Neon branch
- isolated schema/database generated for tests

Do not choose a complex test strategy yet.

For v0.1, database tests must be explicitly isolated before any database-mutating automated test is introduced.

---

## Data retention and auditability

JS OS will record business events, approvals, and agent runs. Those records may become operational audit history.

Therefore:

- avoid destructive updates where historical records matter
- use status changes rather than deletion where appropriate
- BusinessEvents should be treated as append-oriented
- AgentRuns should preserve historical execution output
- Approval decisions should preserve the original request and decision

Do not design archival or retention policies yet.

This matches `docs/data-model.md`: BusinessEvent is append-only; Approval payload and decision fields are retained; AgentRun `inputSnapshot`, `output`, and `error` are audit fields.

---

## IDs

Recommend UUID/CUID-style application-generated IDs rather than sequential business identifiers.

Do not lock the project into numeric auto-increment IDs.

The exact Prisma 8 ID strategy should be selected during schema implementation.

The removed Prisma starter models used `Int @id @default(autoincrement())`. That is scaffold only and is not the JS OS ID decision.

---

## Timestamps

Store timestamps consistently in UTC in PostgreSQL.

Application/UI may display timestamps using the Organization `timezone`.

Fields should continue to follow the existing naming convention:

```text
createdAt
updatedAt
startedAt
completedAt
occurredAt
requestedAt
decidedAt
```

---

## Security principles

- Database credentials are secrets.
- Never commit database credentials.
- Never expose database credentials through `NEXT_PUBLIC_*`.
- Application code should follow least privilege where practical.
- Production database credentials should be limited to production environments.
- Database access should be server-side only.
- Never expose a raw database connection to browser/client code.
- `src/prisma/db.ts` must not be imported from client components.

`.gitignore` ignores `.env*` and allows `.env.example`. That does not replace discipline: credentials must not appear in source, docs, or client bundles.

---

## Initial infrastructure diagram

```text
Local Development
      │
      ▼
JS OS Next.js
      │
      ▼
Neon Development DB


Vercel Preview
      │
      ▼
JS OS Preview
      │
      ▼
Neon Preview/Staging DB


Vercel Production
      │
      ▼
JS OS Production
      │
      ▼
Neon Production DB
```

Future integration boundary:

```text
JS OS Database          JS Growth Database
      │                         │
      └──── Integration/API ────┘
```

> JS OS and JS Growth must not rely on direct cross-database joins.

---

## Environment variable documentation

`.env.example` now contains empty placeholders only:

```text
DATABASE_URL=
DIRECT_URL=
```

Copy to `.env` or `.env.local` when a real Neon database exists. Do not commit filled values.

---

## Operational rules

```text
- Never run local migrations against production.
- Never point Preview at production.
- Never commit database credentials.
- Never use db push as the normal production migration strategy.
- Commit every production migration.
- Back up or otherwise protect important production data before risky schema changes.
- Keep JS OS and JS Growth databases independently deployable.
- Do not run db init, db verify, or db sign until a dedicated non-production database exists.
- Do not let application request handling perform schema-management operations.
```

---

## Open Implementation Decisions

Resolved:

1. Prisma version: Prisma ORM 8 (`prisma@8.0.0-rc.10`, `@prisma/orm-postgres@8.0.0-rc.8`) on Node 24.

Still open until Neon/schema implementation:

2. Exact Neon pooled/direct connection configuration, including whether CLI `prisma.config.ts` should later read `DIRECT_URL`.
3. Whether Preview should use one persistent staging DB or per-branch Neon databases. Long-term intent remains isolated Neon branches.
4. Exact ID generator (`cuid`, `cuid2`, UUID, etc.).
5. Test database isolation mechanism.
6. Whether production migration deployment happens through Vercel build/deploy or a separate controlled CI step.

Low-risk notes only:

- Prefer application-generated UUID/CUID-style IDs over auto-increment integers, but do not pick the generator yet.
- Preview must not share the production database.
- Keep generated Prisma 8 `DATABASE_URL` wiring until Neon exists.

---

## Consistency with existing docs

This design is intended to match:

- `README.md` — JS OS vs JS Growth boundaries; infrastructure added only when a feature needs it
- `docs/architecture.md` — durable business state; JS Growth integration rather than duplication
- `docs/roadmap.md` — Phase 1 business-state entities
- `docs/data-model.md` — owned entities, external `sourceType` / `sourceId`, append-oriented events, approval payloads, AgentRun audit fields

No JS OS business models, Neon database, API routes, UI, or application queries are implied by the current Prisma 8 foundation.
