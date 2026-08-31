# System boundaries

**Status:** Implemented as documentation and data-model policy. Integration code is future.

```text
JS Solutions  = the company
JS Growth     = customer-facing product platform
JS OS         = internal company operating system
```

These are three different things. JS OS must not collapse them.

## JS Solutions

The company. It provides web development, SEO, local SEO, digital marketing, AI integration, automation, and business growth systems.

Company context lives in [company documentation](../company/company-overview.md).

## JS Growth

Customer-facing product platform in the separate `js-growth` repository.

**System of record for:**

- Website Growth Audit
- GBP Audit
- prospects
- leads
- campaigns
- outreach workflows
- opportunities
- competitive intelligence
- related product-specific data

JS OS must not duplicate those records. Future JS OS work will consume JS Growth through APIs and tools. See [JS Growth integration](../integrations/js-growth.md) and [ADR-002](../decisions/ADR-002-js-growth-remains-system-of-record.md).

## JS OS

Internal operating layer for JS Solutions.

**Owns:**

- company-level goals
- business priorities
- work items
- agent definitions
- agent execution history
- approvals
- business events
- cross-system orchestration
- executive business state

JS OS has its own PostgreSQL/Neon database. It does not share tables with JS Growth and must not rely on cross-database joins.

```text
JS OS DB               JS Growth DB
    │                        │
    └──── API/Integration ───┘
```

## External references

JS OS may point at another system’s record:

```text
sourceType = JS_GROWTH
sourceId   = <external record id>
```

JS OS may cache or snapshot external data when required for decisions or audit. The source system remains canonical unless ownership is explicitly transferred.

## Related

- [ADR-001](../decisions/ADR-001-separate-js-os-from-js-growth.md)
- [ADR-002](../decisions/ADR-002-js-growth-remains-system-of-record.md)
