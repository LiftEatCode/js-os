# JS Growth integration

**Status:** Planned. No integration is implemented.

JS Growth is the customer-facing product platform in the separate `js-growth` repository. JS OS will orchestrate it later. JS OS must not duplicate its records.

## Purpose

Give JS OS commercial context (audits, prospects, pipeline) so Sales, Marketing, and CEO layers can prioritize work without a second CRM.

## System of record

JS Growth remains canonical for:

- Website Growth Audit
- GBP Audit
- prospects
- leads
- campaigns
- outreach workflows
- opportunities
- competitive intelligence
- related product-specific data

See [ADR-002](../decisions/ADR-002-js-growth-remains-system-of-record.md) and [system boundaries](../architecture/system-boundaries.md).

## Data JS OS may read

**Status:** Planned

When an API exists, JS OS may read summaries and identifiers for the objects above. JS OS stores pointers:

```text
WorkItem.sourceType = JS_GROWTH
WorkItem.sourceId   = <JS Growth record id>
```

Snapshots in `BusinessEvent.metadata` or `AgentRun.inputSnapshot` are allowed for audit. They do not become the live record.

Do not design the JS Growth API in this document.

## Actions JS OS may eventually request

**Status:** Future

Examples of requests (not implemented, not a committed API):

- fetch audit or prospect status
- open a JS OS WorkItem from a JS Growth record
- request an outreach draft

Sending outreach remains a communications action: tools + approval. JS Growth continues to own the outreach workflow implementation.

## Expected approval considerations

- Reading JS Growth for internal review: low consequence once auth exists.
- Triggering outreach, campaign sends, or customer-visible changes: owner approval.

## Implementation status

Planned. No client, webhook, or shared database. Databases stay independent; no cross-database joins.

WorkItem and BusinessEvent already reserve `JS_GROWTH` as a source type.
