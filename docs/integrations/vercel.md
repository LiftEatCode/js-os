# Vercel integration

**Status:** Planned. Not implemented as a JS OS tool.

## Purpose

Observe deployment health and later request preview or production deploys through explicit tools.

This application is a Next.js app and may be deployed on Vercel in the future. That hosting choice is not the same as a JS OS “Vercel tool.”

## System of record

Vercel is canonical for deployment objects and project settings. JS OS stores WorkItems/events pointing at deployment ids if needed.

## Data JS OS may read

Deployment status, failed builds, preview URLs.

## Actions JS OS may eventually request

Trigger a preview deploy; inspect logs. Production promote/deploy remains separately permissioned.

## Expected approval considerations

Production deployment, domain, and DNS changes require owner approval. See [production-changes policy](../policies/production-changes.md).

## Implementation status

Planned as an integration. No JS OS Vercel API client. Preview database strategy is still future. See [environments](../development/environments.md).
