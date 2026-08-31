# ADR-002: JS Growth remains the system of record

## Status

Accepted

## Context

JS Growth already owns Website Growth Audit, GBP Audit, prospects, leads, campaigns, outreach, opportunities, and competitive intelligence.

JS OS needs commercial context for priorities and work. Copying those records into JS OS would create two sources of truth.

## Decision

JS Growth remains canonical for product-specific commercial data.

JS OS must not model Prospect, Lead, Campaign, Website Audit, GBP Audit, Opportunity, or Competitive Intelligence as first-class owned entities.

JS OS may reference external records:

```text
sourceType = JS_GROWTH
sourceId   = <external id>
```

JS OS may later cache or snapshot external data for decisions or audit. The source system stays canonical unless ownership is explicitly transferred.

## Consequences

- Phase 1 contract stays small
- Command Center and CEO review depend on a future JS Growth integration
- Stale cache/snapshot policy will be needed when snapshots exist
- WorkItem remains the JS OS work unit even when the work is about a JS Growth record

## Alternatives considered

- Duplicate CRM objects in JS OS: rejected.
- Make JS OS the new CRM: rejected; JS Growth already operates that domain.
