# ADR-005: AgentRun audit provenance

## Status

Accepted

## Context

Agents will eventually create work and request approvals. Chat history is a poor system of record. Historical “what created this?” links must not silently disappear if someone deletes a run.

## Decision

- AgentRun is the audit record of one AgentDefinition execution
- Chat history is not authoritative
- `WorkItem.agentRunId` is the creating run (optional)
- `Approval.agentRunId` is the requesting run (optional)
- Those two FKs use `onDelete: Restrict`
- Records may exist without an AgentRun
- If an AgentRun is referenced, it cannot be deleted until dependents are explicitly handled
- BusinessEvent has no `agentRunId` in v0.1; provenance may use source fields/metadata until revisited
- No Cascade in v0.1

## Consequences

- Audit linkage is durable
- Deleting runs requires an explicit data procedure
- Event-to-run tracing is incomplete until a later decision
- Command Center (Milestone 2.7) displays AgentRun history inline on AgentDefinition detail and does not add `BusinessEvent.agentRunId` or an AgentRun route

## Alternatives considered

- SetNull on AgentRun FKs: rejected; silent loss of provenance.
- Required agentRunId on all WorkItems/Approvals: rejected; humans create work without a run.
- Direct BusinessEvent.agentRunId now: deferred; not in the approved v0.1 field list.
