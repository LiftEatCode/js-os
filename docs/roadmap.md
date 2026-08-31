# JS OS Roadmap

High-level sequence. Phases after the current work are **Planned** or **Future**. They are not implementation commitments for unchosen technologies (no FastAPI, queue, worker, or orchestration framework is selected).

Status vocabulary: Implemented, In progress, Planned, Future.

---

## Phase 0 — Foundation

**Status:** Implemented

**Objective:** Establish the repository, application shell, and engineering conventions.

**Major capabilities:** Next.js 16 app, TypeScript, Tailwind, validation scripts, Node 24, Prisma 8 foundation, documented product boundaries.

**Key safety boundary:** Do not add agent runtimes, queues, or integrations before a feature needs them. Do not share a database with JS Growth.

**Exit criteria:** App typechecks/lints/builds; architecture and initial roadmap exist; Prisma 8 is installed without business models yet (models land in Phase 1).

See [phase-00-foundation.md](phases/phase-00-foundation.md).

---

## Phase 1 — Business State

**Status:** Implemented

**Objective:** Persist the durable internal model JS OS will reason about.

**Major capabilities:** Organization, Goal, WorkItem, BusinessEvent, Approval, AgentDefinition, AgentRun; Neon isolation; development migration; Organization and AgentDefinition bootstrap; typed business-state services.

**Key safety boundary:** No production mutations from development. No Cascade deletes. JS Growth records are not duplicated.

**Exit criteria:** Contract implemented; development schema applied and verified; initial JS Solutions Organization and AgentDefinitions bootstrapped; business-state access/service layer. Met. Company Goal rows are deferred operating-state population, not unfinished Phase 1 infrastructure.

See [phase-01-business-state.md](phases/phase-01-business-state.md).

---

## Phase 2 — Command Center

**Status:** In progress

**Objective:** Give humans a central view of running JS Solutions.

**Major capabilities:** Command Center shell and navigation (2.1); live business overview (2.2); owner-managed Goals (2.3); later work, activity, approvals, agents, and a Knowledge browser over `docs/`.

**Key safety boundary:** Read and coordinate. The dashboard does not execute external tools. UI uses business-state services, not raw Prisma. Unauthenticated Goal writes require development plus explicit `JS_OS_COMMAND_CENTER_WRITES=true`.

**Exit criteria:** Owner can see goals, work, approvals, and recent events from live business state. Partially met: Overview is live; Goals can be managed when writes are enabled; other dedicated screens remain.

**Milestones:**

```text
2.1 Command Center shell + navigation     Implemented
2.2 Business overview                     Implemented
2.3 Goals                                 Implemented
2.4 Work                                  Planned
2.5 Activity                              Planned
2.6 Approvals                             Planned
2.7 Agents                                Planned
2.8 Knowledge / documentation browser     Planned
2.9 Integration + polish                  Planned
```

See [phase-02-command-center.md](phases/phase-02-command-center.md).

---

## Phase 3 — Tools + Permissions

**Status:** Planned

**Objective:** Make execution an explicit, permissioned tool boundary.

**Major capabilities:** Tool catalog, permission checks against `AgentDefinition.permissionLevel` as a ceiling plus per-tool rules, request records.

**Key safety boundary:** No unrestricted model access to email, GitHub, payments, or production. Tools do not run consequential actions without approval policy.

**Exit criteria:** At least one non-production tool can be requested and denied/allowed according to documented permission rules. Enforcement exists (today it does not).

---

## Phase 4 — Policies + Operating Rules

**Status:** Planned

**Objective:** Encode approval, risk, and communication rules so tools can consult them.

**Major capabilities:** Approval evaluation for a proposed tool call; risk categories applied to action types; documented operating rules loaded as policy, not only markdown.

**Key safety boundary:** Policy files in git are not enforcement. This phase is when evaluation starts. High-consequence actions still require owner approval.

**Exit criteria:** A proposed action can be classified as needing approval or not, using policy rather than ad hoc prompts.

---

## Phase 5 — CEO Reasoning Loop

**Status:** Planned

**Objective:** Produce a structured executive review from current business state.

**Major capabilities:** Inspect state vs goals; identify risks and opportunities; recommend priorities and work. No autonomous sensitive execution.

**Key safety boundary:** CEO review recommends and may create WorkItems/Approval *requests*. It does not send mail, spend, or deploy.

**Exit criteria:** Repeatable CEO review from live Organization/Goal/WorkItem/Event data, visible in the Command Center.

---

## Phase 6 — JS Growth Integration

**Status:** Planned

**Objective:** Expose real commercial data to JS OS without copying JS Growth’s system of record.

**Major capabilities:** Read leads, prospects, campaigns, opportunities, Website Growth Audits, GBP Audits; WorkItems with `sourceType = JS_GROWTH`.

**Key safety boundary:** No shared tables or cross-database joins. Canonical records stay in JS Growth. Outreach send remains approval-gated.

**Exit criteria:** JS OS can display and attach work to JS Growth records via API/tools, not by duplicating CRM rows.

---

## Phase 7 — Sales Department

**Status:** Planned

**Objective:** Coordinate prospecting and sales using JS Growth capabilities.

**Major capabilities:** Sales WorkItems, follow-up queues, handoff to client operations after close.

**Key safety boundary:** No second CRM. Outbound sales messages require tools + approval.

**Exit criteria:** Sales work is visible and prioritized in JS OS while JS Growth remains canonical for pipeline objects.

---

## Phase 8 — Marketing Department

**Status:** Planned

**Objective:** Coordinate content, SEO, local SEO, social, and campaign workflows.

**Major capabilities:** Marketing WorkItems; campaign/audit inputs from JS Growth; publish as an approval-gated action.

**Key safety boundary:** Publishing and paid spend require approval. JS OS does not become the ad-platform of record.

**Exit criteria:** Marketing work is tracked in JS OS; publish/spend cannot bypass approval policy.

---

## Phase 9 — Client Operations

**Status:** Planned

**Objective:** Coordinate client deliverables, reporting, health, and growth opportunities.

**Major capabilities:** `CLIENT_WORK` items, overdue/blocked visibility, handoff WorkItems to other departments.

**Key safety boundary:** Client-facing reports and messages remain approval-gated. Do not fork client records out of their systems of record.

**Exit criteria:** Delivery queue and health signals are visible; growth opportunities route to Sales/Marketing as work, not copied CRM.

---

## Phase 10 — Engineering Operations

**Status:** Planned

**Objective:** Assist with issue discovery, development, validation, and pull-request workflows.

**Major capabilities:** Engineering WorkItems; future GitHub read/prepare-PR tools.

**Key safety boundary:** Production deploy, DNS, and destructive database actions stay separately permissioned. Prepare ≠ production apply.

**Exit criteria:** Engineering work can be tracked and (later) prepared as PRs without implied production access.

---

## Phase 11 — Finance Operations

**Status:** Planned

**Objective:** Surface money movement and financial risk without silently becoming the accounting system.

**Major capabilities:** Finance WorkItems; future payments events; spend/refund Approvals.

**Key safety boundary:** The payments provider remains canonical until ownership is transferred. Charge/refund/pay require owner approval.

**Exit criteria:** Financial events can inform CEO/Finance review; no unapproved money movement from JS OS.

---

## Phase 12 — Scheduled Operating Cycles

**Status:** Future

**Objective:** Run daily/weekly/monthly/quarterly reviews from business state.

**Major capabilities:** Scheduled CEO/department reviews; exception surfacing. See [operations](operations/daily-cycle.md).

**Key safety boundary:** Schedules inspect and recommend. They do not execute consequential tools without Phase 3–4 controls.

**Exit criteria:** Recurring reviews produce WorkItems/Approval requests on a known cadence. No scheduler exists today.

---

## Phase 13 — Cross-Department Coordination

**Status:** Future

**Objective:** Let the CEO layer assign and sequence work across departments from one state model.

**Major capabilities:** Priority conflicts, handoffs, shared WorkItem graph.

**Key safety boundary:** Coordination is still tool- and approval-bound. Departments do not gain extra production or spend rights by being coordinated.

**Exit criteria:** Multi-department work is visible as related WorkItems with explicit handoffs.

---

## Phase 14 — Progressive Autonomy

**Status:** Future

**Objective:** Raise autonomy only on proven, low-risk workflows.

**Major capabilities:** Selective `EXECUTE` for bounded tools; remaining work stays recommend/prepare.

**Key safety boundary:** Levels 3–6 of the long-term maturity model are not implied. High-risk actions still need owner approval. See [autonomy policy](policies/autonomy.md).

**Exit criteria:** At least one low-risk workflow can execute within policy with an audit trail (AgentRun + BusinessEvent).

---

## Phase 15 — Autonomous Business Operations

**Status:** Future

**Objective:** Owner sets direction and approves consequence; the CEO layer coordinates day-to-day within policy.

**Major capabilities:** Policy-bound department operation; owner remains the authority for consequential actions.

**Key safety boundary:** This is not “unattended production and spend.” Autonomy never bypasses tools, permissions, or approvals.

**Exit criteria:** Defined only after Phases 3–14 are proven. Do not treat this phase as scheduled work.

---

## Explicitly out of scope until chosen

No current phase selects FastAPI, queues, workers, LangGraph, or a specific agent orchestration framework. Those wait for a concrete feature that needs them.
