# Deployment

**Status:** Planned. This document does not claim a live production deploy.

JS OS is a Next.js application. Hosting on Vercel is the intended direction because of the existing Next.js + Neon pairing. No JS OS deploy pipeline, production promotion tool, or DNS automation is implemented.

## Intended constraints

- Production uses the Neon production branch only.
- Preview, when it exists, must use a non-production database.
- Production schema changes use committed migrations, applied only after reviewing a plan.
- Production deployment, DNS, and destructive database actions stay approval-gated. See [production changes](../policies/production-changes.md).

Whether production migrate runs in Vercel build or a separate CI/ops step is not decided.

A future Vercel *integration* (reading deploys as business events) is separate from hosting. See [Vercel integration](../integrations/vercel.md).
