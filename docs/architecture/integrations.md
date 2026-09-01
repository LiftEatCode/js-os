# Integrations (architecture)

**Status:** Planned. No live integrations are implemented.

JS OS will orchestrate other systems rather than copy them. Each integration has a system of record. JS OS stores pointers (`sourceType` / `sourceId`) and, later, snapshots when audit requires it.

```text
JS OS DB               External system
    │                        │
    └──── API / tools ───────┘
```

No cross-database joins. No shared tables with JS Growth.

## Planned systems

| System | Role | Detail |
|---|---|---|
| JS Growth | Commercial product data | [js-growth.md](../integrations/js-growth.md) |
| GitHub | Engineering work | [github.md](../integrations/github.md) |
| Email | Communications | [email.md](../integrations/email.md) |
| Calendar | Time and deadlines | [calendar.md](../integrations/calendar.md) |
| Payments | Money movement | [payments.md](../integrations/payments.md) |
| Vercel | Deployment | [vercel.md](../integrations/vercel.md) |

WorkItem external source types already reserved: `JS_GROWTH` | `GITHUB` | `EMAIL` | `CALENDAR` | `PAYMENTS` | `OTHER`.

Consequential outbound actions from any integration will require tools plus approvals. Phase 3 designs that boundary ([tool architecture](tool-architecture.md)); adapters for these systems are not a Phase 3 deliverable.

See [system boundaries](system-boundaries.md).
