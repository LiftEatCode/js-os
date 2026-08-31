# JS OS Database Architecture

## Purpose

This document defines the database foundation for JS OS Phase 1.

It records provider, isolation, migration, and security decisions before Prisma is installed and before any schema is written.

Do not treat this file as an implemented database. There is no Prisma schema, no migrations, no client, and no environment files with credentials yet.

The v0.1 domain model lives in `docs/data-model.md`. The first Prisma schema should be generated from that document, not designed ad hoc during installation.

---

## Database direction

```text
Database: PostgreSQL
Managed provider: Neon
ORM / migration tooling: Prisma
```

Why:

- PostgreSQL is a strong fit for relational business state: organizations, goals, work items, approvals, events, and agent runs have explicit relationships and statuses.
- Prisma provides an explicit schema and committed migration history, which matches how JS OS should evolve durable state.
- Neon provides managed PostgreSQL and works well with serverless Next.js deployments on Vercel.
- JS OS should have its own database rather than sharing JS Growth's database.
- Cross-system integration with JS Growth should happen through APIs and integration boundaries, not direct table coupling.

JS Growth already uses PostgreSQL/Neon with Prisma. JS OS should follow a similar stack for operational familiarity, but the databases remain independent.

This does not add FastAPI, queues, workers, or LLM infrastructure. Those wait until a later feature requires them.

---

## Isolation principle

> Development, preview, test, and production database activity must be isolated. No development command, migration experiment, seed script, automated test, or preview deployment should be capable of mutating the production database.

Environment separation is a safety boundary, not just convenience.

JS OS will store goals, work, approvals, business events, and agent runs. Accidental writes to production would corrupt operating state and audit history.

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

Local `.env.local` will eventually contain values such as:

```text
DATABASE_URL=
DIRECT_URL=
```

Do not create `.env.local` as part of this design step. `.gitignore` already ignores `.env*` and allows `.env.example`. `.env.example` should be added when Prisma is installed, not now.

### Preview / Staging

Vercel Preview deployments should use a non-production database.

Prefer a dedicated preview/staging database or Neon branch.

Preview environments must never point at production credentials.

### Production

Production Vercel deployments use the production JS OS database only.

Production credentials should exist only in production environment configuration.

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

This matches `docs/data-model.md`: `sourceType` / `sourceId` are for external or integration-origin references. Core JS OS relationships use dedicated foreign keys. JS OS and JS Growth must not share tables or rely on direct cross-database joins.

---

## Prisma strategy

Prisma will be introduced after this database-design commit.

Initial expected packages later:

```text
prisma
@prisma/client
```

Do not install them yet.

The initial Prisma schema should be generated from `docs/data-model.md`, including the v0.1 decisions:

- entity-specific enums
- optional `WorkItem.agentRunId`
- no WorkItem JSON metadata
- no Goal hierarchy
- `Approval.payload` instead of a ProposedAction entity
- JSON candidates limited to `BusinessEvent.metadata`, `Approval.payload`, `AgentRun.inputSnapshot`, and `AgentRun.output`

---

## Prisma generation

After Prisma is installed, Prisma Client generation should become part of the normal project workflow.

Expected future scripts may include:

```json
"db:generate": "prisma generate",
"db:validate": "prisma validate"
```

Do not add these scripts until Prisma is installed.

---

## Migration strategy

### Development

Schema changes should be made through Prisma migrations.

Expected workflow later:

```bash
npx prisma migrate dev --name <migration-name>
```

Development migrations should run only against the development database.

### Production

Production schema changes should use committed migrations.

Expected deployment command later:

```bash
npx prisma migrate deploy
```

Do not use:

```bash
prisma db push
```

as the normal production schema-management strategy.

`db push` may be useful for temporary prototyping. It must not replace migration history once the real schema exists.

---

## Migration source of truth

```text
prisma/schema.prisma
+
prisma/migrations/
```

will eventually become the source of truth for database structure.

All production schema changes should be represented by committed migrations.

Until those files exist, `docs/data-model.md` is the domain source of truth and this document is the database-operations source of truth.

---

## Direct URL vs pooled URL

Neon may expose both pooled and direct database connections.

Expected future convention:

```text
DATABASE_URL
DIRECT_URL
```

- `DATABASE_URL` is used by the application runtime.
- `DIRECT_URL` may be used by Prisma migration/admin operations when appropriate.
- Exact Neon connection configuration should be confirmed when Prisma is installed.

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

The exact Prisma ID strategy (`cuid`, `cuid2`, UUID, or similar) should be selected during schema implementation.

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

`.gitignore` already ignores `.env*` files. That does not replace discipline: credentials must not appear in source, docs, or client bundles.

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

Expected future `.env.example` database variables:

```text
DATABASE_URL=
DIRECT_URL=
```

`.env.example` does not exist yet. Create it during the Prisma implementation step, with empty documented values and no secrets.

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
```

---

## Open Implementation Decisions

These are left for the Prisma implementation step unless a later review resolves them.

1. Exact Prisma version compatible with the current Next.js/Node environment.
2. Exact Neon pooled/direct connection configuration.
3. Whether Preview should use one persistent staging DB or per-branch Neon databases.
4. Exact ID generator (`cuid`, `cuid2`, UUID, etc.).
5. Test database isolation mechanism.
6. Whether production migration deployment happens through Vercel build/deploy or a separate controlled CI step.

Low-risk notes only:

- Prefer application-generated UUID/CUID-style IDs over auto-increment integers, but do not pick the generator yet.
- Prefer `prisma migrate deploy` over `db push` in production, regardless of whether deploy runs in Vercel or CI.
- Preview must not share the production database; persistent staging vs per-branch Neon can be chosen at implementation.

---

## Consistency with existing docs

This design is intended to match:

- `README.md` — JS OS vs JS Growth boundaries; infrastructure added only when a feature needs it
- `docs/architecture.md` — durable business state; JS Growth integration rather than duplication; database deferred until the first real use case (Phase 1 schema implementation)
- `docs/roadmap.md` — Phase 1 business-state entities
- `docs/data-model.md` — owned entities, external `sourceType` / `sourceId`, append-oriented events, approval payloads, AgentRun audit fields

No Prisma packages, schema, migrations, client code, API routes, or UI are implied by this document.
