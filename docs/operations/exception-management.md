# Exception management

**Status:** Future

Exceptions are events or work that break the expected operating rhythm: failed deploys, overdue client work, rejected high-risk approvals, integration outages.

Intended handling (not implemented):

1. Record a BusinessEvent.
2. Open or update a WorkItem.
3. If consequential, create an Approval.
4. Surface in the Command Center (Phase 2) rather than only in chat.

No paging, on-call, or incident-tool choice is made here.
