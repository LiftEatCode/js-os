# ADR-004: Neon environment isolation

## Status

Accepted

## Context

JS OS will store goals, work, approvals, events, and agent-run history. Accidental writes to production would corrupt operating state and audit records.

Neon exposes pooled and direct connection modes. Prisma CLI/admin work is a poor fit for a pooled URL. Next.js runtime is a good fit for pooling.

## Decision

- Local development uses the Neon development branch only
- Production uses the Neon production branch only
- Preview must never use production credentials; isolated preview/staging is future
- `DATABASE_URL` is the pooled runtime connection (`src/prisma/db.ts`)
- `DIRECT_URL` is the direct CLI/admin connection (`prisma.config.ts`)
- Local secrets live in gitignored `.env.local`
- Prisma CLI loads `.env.local` explicitly (not only `.env`)
- No development command, seed, test, or preview may mutate production

## Consequences

- Two connection strings must be maintained per environment
- Schema-management stays a CLI/ops path, not request handling
- Preview isolation is still an open implementation choice (persistent staging vs per-branch)

## Alternatives considered

- One URL for CLI and runtime: rejected; Neon pooled vs direct differ.
- Store secrets in tracked `.env`: rejected.
- Allow preview to share production: rejected.
