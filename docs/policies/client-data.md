# Client data

**Status:** Draft operating definition. No client CRM in JS OS.

JS OS stores internal operating state (goals, work, events, approvals, agent runs). Canonical product commercial records — prospects, leads, audits, campaigns, opportunities — remain in JS Growth.

When JS OS later reads JS Growth or other systems:

- Prefer pointers (`sourceType` / `sourceId`) over copies.
- Snapshot only when a decision or audit record needs a frozen view.
- The source system stays canonical unless ownership is explicitly transferred.
- Outbound client communications remain approval-gated.

Do not invent retention periods, DPA language, or named clients here.

See [system boundaries](../architecture/system-boundaries.md) and [communications](communications.md).
