# JS OS Tool Catalog v1

**Status:** Architecture / operating hypothesis v1

## Purpose

Define the executable capabilities JS OS will eventually need to operate JS Solutions, the risks associated with those capabilities, and the permission/approval boundaries that must exist before agents can use them.

The governing model is:

**Agent responsibility → Tool request → Permission check → Policy check → Approval when required → Execution → Validation → Business event / audit record**

A tool is an executable capability. It is not an agent, policy, workflow, or permission grant.

## Core principles

1. Agents never gain a capability merely because they can describe how to perform it.
2. Tool access is explicitly granted and bounded.
3. Read and write capabilities are separate tools/permissions where practical.
4. Production and non-production capabilities are separate.
5. Client scope is part of authorization.
6. Consequential external actions should begin behind approval.
7. Tool execution must produce durable provenance and outcome state.
8. Failed validation can block completion even if an external API call technically succeeded.
9. Credentials are platform-managed secrets, not prompt context.
10. Autonomy increases from evidence, policy, and bounded risk—not convenience.

---

# 1. Tool risk model

## LOW
Read-only or reversible internal actions with limited consequence.

Examples:
- read business state;
- search approved public sources;
- read repository files;
- run an internal calculation;
- create an internal draft/work item.

Typical initial posture: may become autonomous early when scoped and audited.

## MODERATE
Actions that create or modify non-production artifacts, external drafts, or internal state with meaningful workflow consequences.

Examples:
- create email draft;
- create Git branch;
- prepare code change;
- create CRM/prospect record;
- update internal pipeline state;
- create preview deployment.

Typical initial posture: bounded execution, sometimes approval depending on context.

## HIGH
Actions that communicate externally, modify production/client systems, publish public content, or make consequential business changes.

Examples:
- send email;
- publish website content;
- deploy production;
- modify GBP;
- modify production CRM/customer state;
- change analytics/tracking in production.

Typical initial posture: explicit approval.

## CRITICAL
Actions involving money, contracts, credentials/security, destructive operations, legal/accounting commitments, or unusually broad blast radius.

Examples:
- issue refund/payment;
- purchase/commit spend;
- sign/accept contract;
- rotate/delete production credentials;
- destructive database operation;
- delete client production property;
- change billing/subscription terms.

Typical posture: explicit human authorization plus stronger policy controls; some capabilities may remain permanently human-only.

---

# 2. Common tool contract

Every registered JS OS tool should eventually declare at least:

- stable tool identifier;
- version;
- description;
- input schema;
- output schema;
- read/write/side-effect classification;
- risk level;
- permission identifier;
- approval mode;
- allowed environments;
- allowed resource/client scope;
- idempotency/retry behavior where relevant;
- timeout behavior;
- validation requirements;
- audit/provenance requirements;
- credential/integration dependency;
- rollback/recovery characteristics;
- owning department/system.

Tool definitions should be deterministic contracts around capabilities even when an agent chose the inputs.

---

# 3. Approval modes

Working catalog vocabulary:

### NONE
No per-execution approval required once the agent/tool/scope permission is valid.

### CONDITIONAL
Policy determines whether this specific execution requires approval based on risk, environment, resource, amount, recipient, change size, client setting, or other explicit condition.

### ALWAYS
Every execution requires a valid approval.

### HUMAN_ONLY
The capability may be represented in JS OS for workflow/audit purposes but cannot be autonomously executed by an agent.

This vocabulary informs Phase 3/4 design; it does not replace the existing approval domain model.

---

# 4. Internal business-state tools

## `business_state.read`

**Purpose:** Read approved JS OS business state needed for reasoning.  
**Risk:** LOW  
**Approval:** NONE  
**Candidate agents:** all, scoped by role.

May expose goals, WorkItems, BusinessEvents, approvals, agent runs, and later department state according to permissions.

## `work_item.create`

**Purpose:** Create an internal proposed unit of work.  
**Risk:** LOW/MODERATE  
**Approval:** NONE initially for bounded internal creation; policy may restrict classes.  
**Candidate agents:** CEO, department agents.

Creating work is not equivalent to authorizing its external execution.

## `work_item.update`

**Purpose:** Update status/metadata of authorized internal work.  
**Risk:** MODERATE  
**Approval:** CONDITIONAL  
**Candidate agents:** owning/coordinating agents.

State transitions must preserve business-event/audit invariants.

## `business_event.append`

**Purpose:** Record an append-only business event through controlled domain services.  
**Risk:** MODERATE  
**Approval:** NONE when produced as part of an authorized atomic operation.  
**Candidate agents:** not normally called directly by reasoning agents.

Prefer domain operations that emit events atomically rather than arbitrary event writing.

---

# 5. Public research / web tools

## `web.search`

**Purpose:** Search public web sources for approved business research.  
**Risk:** LOW  
**Approval:** NONE  
**Candidate agents:** Prospecting, Prospect Research, Sales, Marketing, Client Operations, CEO.

Guardrails:
- public information only;
- no bypassing authentication/CAPTCHA/access controls;
- source provenance retained where decisions depend on evidence.

## `web.fetch`

**Purpose:** Retrieve a permitted public page/document for analysis.  
**Risk:** LOW  
**Approval:** NONE.

## `business_directory.search`

**Purpose:** Discover public businesses/locations/categories.  
**Risk:** LOW  
**Approval:** NONE.  
**Candidate agents:** Prospecting, Research, Local Visibility, SEO.

## `website.crawl`

**Purpose:** Crawl an approved public/client website within configured limits.  
**Risk:** LOW to MODERATE depending on depth/rate.  
**Approval:** NONE/CONDITIONAL.  
**Candidate agents:** Research, Website Optimization, SEO.

Must honor rate/resource limits and avoid aggressive or unauthorized scanning.

---

# 6. Prospect / CRM tools

JS Growth remains the system of record for product/commercial CRM/prospecting data when integrated in Phase 6.

## `prospect.read`

**Purpose:** Read authorized prospect/CRM state.  
**Risk:** LOW  
**Approval:** NONE.  
**Candidate agents:** Prospecting, Research, Sales, CEO.

## `prospect.create_candidate`

**Purpose:** Create a candidate prospect from verified research.  
**Risk:** MODERATE  
**Approval:** NONE/CONDITIONAL based on integration maturity.

Creation does not authorize outreach.

## `prospect.update_stage`

**Purpose:** Update prospect/pipeline stage using approved transitions.  
**Risk:** MODERATE  
**Approval:** CONDITIONAL.  
**Candidate agents:** Sales.

Transitions should be evidence-backed and auditable.

## `prospect.suppress_contact`

**Purpose:** Record opt-out/do-not-contact state.  
**Risk:** MODERATE but protective.  
**Approval:** NONE when triggered by verified opt-out.  
**Candidate agents:** Sales/system response handler.

Suppression should take precedence over future outreach workflows.

---

# 7. Email tools

## `email.search`

**Purpose:** Search authorized business mailbox for prospect/client context.  
**Risk:** LOW/MODERATE due privacy.  
**Approval:** NONE after account/scope permission.  
**Candidate agents:** Sales, Client Operations, CEO where necessary.

Apply least-privilege mailbox/query scope.

## `email.read_thread`

**Purpose:** Read a specific relevant conversation before drafting/responding.  
**Risk:** MODERATE  
**Approval:** NONE after scope authorization.

## `email.create_draft`

**Purpose:** Prepare an external email without sending.  
**Risk:** MODERATE  
**Approval:** NONE/CONDITIONAL.  
**Candidate agents:** Sales, Client Operations, Marketing, Finance for approved contexts.

Drafting is the preferred early-autonomy communication capability.

## `email.send`

**Purpose:** Send an external email.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.  
**Candidate agents:** Sales, Client Operations, Marketing/Finance only in approved workflows.

Required checks should include recipient, thread/context, suppression state, purpose, attachment, and approval validity.

Future bounded autonomy may permit narrow transactional classes, but cold/bulk outreach should never become unconstrained autonomous sending.

## `email.bulk_send`

**Purpose:** High-volume external email.  
**Risk:** CRITICAL  
**Approval:** HUMAN_ONLY / not an initial JS OS capability.

Do not design the acquisition system around bulk-send autonomy.

---

# 8. Calendar / meeting tools

## `calendar.read`

**Purpose:** Read relevant availability/events.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after scope authorization.

## `calendar.check_availability`

**Purpose:** Find valid meeting windows.  
**Risk:** LOW  
**Approval:** NONE.

## `calendar.create_event`

**Purpose:** Create meeting/event and optionally invite external attendees.  
**Risk:** HIGH when external invite is sent.  
**Approval:** ALWAYS initially; may become CONDITIONAL for explicitly requested scheduling.

## `calendar.update_event`

**Risk:** HIGH for external meetings.  
**Approval:** CONDITIONAL/ALWAYS.

---

# 9. Google / search-performance tools

## `search_console.read`

**Purpose:** Read authorized Search Console properties/query/page/index data.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after client/account authorization.  
**Candidate agents:** Client Growth Strategist, Website Optimization, SEO, Reporting.

## `analytics.read`

**Purpose:** Read approved analytics/conversion data.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after authorization.

## `analytics.configure`

**Purpose:** Modify production analytics/events/tracking configuration.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.

## `gbp.read`

**Purpose:** Read authorized Google Business Profile data/performance when API access exists.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after authorization.

The Revenue Engine must not depend on this tool being available.

## `gbp.update`

**Purpose:** Change authorized public business-profile data/content.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.

Public facts, service areas, hours, categories, URLs, posts, etc. require evidence and client scope. Never create fake locations/service areas or keyword-stuffed names.

---

# 10. Website analysis tools

## `website.audit`

**Purpose:** Run approved website checks and return structured evidence.  
**Risk:** LOW  
**Approval:** NONE.  
**Candidate agents:** Prospect Research, Website Optimization, SEO.

May include crawlability, metadata, links, schema, performance, accessibility/usability indicators, content architecture, conversion paths, and other approved checks.

## `website.screenshot`

**Purpose:** Capture public/authorized page evidence.  
**Risk:** LOW  
**Approval:** NONE.

## `website.compare`

**Purpose:** Compare before/after or competitor/public page evidence.  
**Risk:** LOW  
**Approval:** NONE.

The tool returns evidence; the agent owns interpretation subject to policy.

---

# 11. GitHub / code tools

## `github.read_repository`

**Purpose:** Read authorized repository structure/code/docs/issues.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after repository permission.  
**Candidate agents:** Website Optimization, Engineering.

## `github.create_branch`

**Purpose:** Create a non-production working branch.  
**Risk:** MODERATE  
**Approval:** NONE/CONDITIONAL depending on client/repo policy.

## `github.prepare_change`

**Purpose:** Create/update files on an authorized non-protected branch.  
**Risk:** MODERATE  
**Approval:** CONDITIONAL.  
**Candidate agents:** Website Optimization, Engineering.

## `github.open_pull_request`

**Purpose:** Submit prepared changes for review.  
**Risk:** MODERATE  
**Approval:** NONE/CONDITIONAL depending on repository/client policy.

A PR is a preferred boundary between AI-prepared work and production mutation.

## `github.merge_pull_request`

**Purpose:** Merge approved code.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.

Protected branch/repository policy remains authoritative.

## `github.delete_branch_or_file`

**Purpose:** Destructive repository operation.  
**Risk:** HIGH/CRITICAL depending on resource.  
**Approval:** ALWAYS.

---

# 12. Build / test / validation tools

## `code.run_tests`

**Purpose:** Run approved test commands in isolated workspace.  
**Risk:** LOW/MODERATE  
**Approval:** NONE after environment authorization.

## `code.build`

**Purpose:** Build application in approved isolated/non-production environment.  
**Risk:** LOW/MODERATE  
**Approval:** NONE.

## `code.lint_typecheck`

**Purpose:** Run static validation.  
**Risk:** LOW  
**Approval:** NONE.

## `change.validate`

**Purpose:** Aggregate required validation evidence before an execution can be considered successful.  
**Risk:** LOW  
**Approval:** NONE.

Validation results should be attached to the tool request/run/outcome where relevant.

---

# 13. Deployment tools

## `deploy.preview`

**Purpose:** Create a non-production preview deployment from approved code.  
**Risk:** MODERATE  
**Approval:** NONE/CONDITIONAL depending on client/repo policy.  
**Candidate agents:** Website Optimization, Engineering.

## `deploy.production`

**Purpose:** Deploy an approved version to production.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.

Required context should include:
- exact source/version;
- validation result;
- target project/environment;
- change/work item;
- approval;
- rollback/recovery plan where appropriate.

## `deploy.rollback`

**Purpose:** Restore a prior known-good production version.  
**Risk:** HIGH but protective.  
**Approval:** CONDITIONAL/ALWAYS; emergency policy may eventually permit bounded rollback.

---

# 14. Content / publishing tools

## `content.create_draft`

**Purpose:** Prepare social/article/site/email content.  
**Risk:** LOW/MODERATE  
**Approval:** NONE.  
**Candidate agents:** Content, Local Visibility, Client Operations.

## `content.publish_website`

**Purpose:** Publish public website content outside a code-deploy flow.  
**Risk:** HIGH  
**Approval:** ALWAYS initially.

## `content.publish_social`

**Purpose:** Publish to social platform.  
**Risk:** HIGH  
**Approval:** ALWAYS initially; may later become CONDITIONAL for approved recurring content classes.

Public claims and client brand scope apply.

---

# 15. Document / sales artifact tools

## `document.generate_audit`

**Purpose:** Render an approved prospect/client audit from structured findings.  
**Risk:** MODERATE  
**Approval:** NONE for internal generation; external delivery separately controlled.

## `document.generate_proposal`

**Purpose:** Render a proposal from approved commercial terms and scope.  
**Risk:** MODERATE  
**Approval:** NONE for draft generation.

## `document.generate_report`

**Purpose:** Render client monthly/business report.  
**Risk:** MODERATE  
**Approval:** NONE for draft; external delivery may require approval.

Document generation must not invent missing business facts/metrics.

---

# 16. Finance / billing tools

## `billing.read`

**Purpose:** Read authorized invoice/subscription/payment status.  
**Risk:** MODERATE  
**Approval:** NONE after authorization.  
**Candidate agents:** Finance, CEO, Client Operations where needed.

## `billing.create_invoice_draft`

**Purpose:** Prepare invoice/payment request without final consequential action.  
**Risk:** MODERATE/HIGH  
**Approval:** CONDITIONAL.

## `billing.charge_or_send_invoice`

**Purpose:** Trigger financial/customer billing action.  
**Risk:** CRITICAL  
**Approval:** ALWAYS.

## `billing.refund`

**Purpose:** Return customer funds.  
**Risk:** CRITICAL  
**Approval:** ALWAYS/HUMAN_ONLY depending on policy.

## `spend.commit`

**Purpose:** Purchase/commit company funds.  
**Risk:** CRITICAL  
**Approval:** ALWAYS with amount/vendor limits; large/novel spend may remain HUMAN_ONLY.

---

# 17. Contract / legal-adjacent tools

## `contract.prepare`

**Purpose:** Prepare an approved contract/agreement from a reviewed template.  
**Risk:** HIGH  
**Approval:** CONDITIONAL for preparation.

## `contract.send_for_signature`

**Purpose:** Send commercial/legal agreement externally.  
**Risk:** CRITICAL  
**Approval:** ALWAYS.

## `contract.accept_or_sign`

**Purpose:** Legally bind JS Solutions.  
**Risk:** CRITICAL  
**Approval:** HUMAN_ONLY unless future legal/authority design explicitly changes this.

Agents must not provide legal/accounting representations beyond approved templates/policy.

---

# 18. Credential / integration administration tools

## `integration.status`

**Purpose:** Read whether approved integration is connected/healthy and what scopes exist.  
**Risk:** LOW/MODERATE  
**Approval:** NONE.

## `integration.connect_or_change_scope`

**Purpose:** Authorize/change third-party account access.  
**Risk:** HIGH/CRITICAL  
**Approval:** ALWAYS/HUMAN_ONLY.

## `secret.read_value`

**Purpose:** Expose raw secret value to an agent.  
**Risk:** CRITICAL  
**Approval:** PROHIBITED as a normal agent tool.

Agents should receive capability handles/integration status, not raw credentials.

## `secret.rotate_or_delete`

**Purpose:** Modify production credential lifecycle.  
**Risk:** CRITICAL  
**Approval:** HUMAN_ONLY/strong explicit approval.

---

# 19. Client scope model

A tool permission must answer not only **what tool?** but **for what resource?**

Examples:
- Website Optimization Agent may read `client-a/site-repo` but not every repository in the owner account.
- SEO Agent may read Client A Search Console property but not unrelated properties.
- Sales Agent may draft to a verified prospect but not email arbitrary contacts.
- Client Reporting Agent may read approved analytics but not mutate tracking.

Candidate scope dimensions:
- organization/client;
- integration/account;
- repository/project;
- environment;
- domain/property;
- mailbox/label/thread;
- recipient/contact;
- financial amount;
- action class.

Broad account-level credentials should not imply broad agent-level authorization.

---

# 20. Agent-to-tool starting matrix

Legend:
- **R** = read/observe candidate
- **P** = prepare/non-consequential candidate
- **A** = consequential action only through approval/policy
- blank = not normally required

| Capability | CEO | Prospecting | Research | Sales | Marketing | Client Strategy | Website/SEO | Engineering | Reporting | Finance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Business state | R | R | R | R | R | R | R | R | R | R |
| Public web/business research | R | R | R | R | R | R | R | R | R | R |
| Prospect/CRM | R | P | P | P/A |  | R |  |  |  | R |
| Email read | R |  |  | R |  | R |  |  | R | R |
| Email draft |  |  |  | P | P | P |  |  | P | P |
| Email send |  |  |  | A | A | A |  |  | A | A |
| Calendar | R |  |  | P/A |  | P/A |  |  |  |  |
| Analytics/Search Console/GBP read | R |  | R* |  | R* | R | R |  | R | R |
| Website audit/crawl | R | R | R | R | R | R | R | R | R |  |
| GitHub read | R |  |  |  |  | R | R | R |  |  |
| GitHub branch/change/PR |  |  |  |  |  |  | P | P |  |  |
| Merge/deploy production |  |  |  |  |  |  | A | A |  |  |
| Content draft |  |  |  | P | P | P | P |  | P |  |
| Public publish |  |  |  |  | A | A | A |  |  |  |
| Audit/proposal/report generation | R |  | P | P |  | P | P |  | P | R |
| Billing read | R |  |  | R |  | R |  |  |  | R |
| Billing/spend action | A |  |  |  |  |  |  |  |  | A |

`R*` means only when relevant to approved internal/competitive/public or client scope.

This matrix is a starting permission hypothesis, not a hard-coded entitlement list.

---

# 21. Phase alignment

This catalog directly informs the locked JS OS roadmap.

## Phase 3.5 — Approval Integration
Establish the approval lifecycle required before consequential tools can execute.

## Phase 3.6 — Internal Safe Tools
Start with low-risk internal capabilities such as business-state reads, internal calculations/work preparation, and other deterministic safe tools. Do **not** begin by wiring Gmail send, production deploy, billing, or other high-risk external actions.

## Phase 3.7 — Tools Command Center
Expose registered tools, requests, state, permission/approval requirements, and outcomes for human oversight.

## Phase 3.8 — Integration + Validation
Prove tool execution invariants, denial/approval behavior, failure handling, event/audit provenance, and safe boundaries before Phase 4.

## Phase 4 — Policies
Move contextual operating rules such as amounts, environments, client scopes, message classes, production rules, and autonomy conditions into explicit policy.

## Phase 5+ — Reasoning and departments
Agents begin requesting/using the tool contracts rather than receiving direct integrations.

---

# 22. First implementation tool set

When Phase 3.6 begins, the first tools should intentionally be boring and safe.

Candidate initial set:

1. `business_state.read_summary`
2. `goal.list_active`
3. `work_item.list_open`
4. `business_event.list_recent`
5. `business_metrics.calculate_snapshot`

Characteristics:
- internal only;
- deterministic;
- no external side effects;
- no production/client mutation;
- useful to future CEO reasoning;
- sufficient to exercise registration, permission, request, execution, completion/failure, event, and audit infrastructure.

Only after the infrastructure is proven should integrations progressively add read-only external tools, preparation tools, and then approved consequential tools.

---

# 23. Tool admission checklist

Before adding a new executable tool to JS OS, answer:

1. Which documented business responsibility needs it?
2. Why is a tool preferable to a human/manual step or deterministic internal workflow?
3. Is it read-only or side-effecting?
4. What is the worst plausible failure?
5. What is the blast radius?
6. Can the resource scope be constrained?
7. What permission controls it?
8. Does it require approval?
9. What policy conditions apply?
10. What credentials/integration scopes are required?
11. How is success validated?
12. What is recorded in the audit trail?
13. Is retry safe/idempotent?
14. Can it be rolled back or compensated?
15. Which agents actually need it?
16. What evidence would justify greater autonomy later?

If these cannot be answered, the tool is not ready for admission.

---

# 24. Autonomy progression

Tools should progress independently rather than assigning one autonomy level to an entire agent.

Example Sales Agent:

- read prospect: autonomous;
- research public website: autonomous;
- prepare outreach: autonomous;
- create draft: potentially autonomous;
- send cold outreach: approval-controlled;
- suppress opt-out: autonomous protective action after verified signal;
- change pricing: not authorized;
- sign contract: human-only.

Example Website Optimization Agent:

- crawl/analyze site: autonomous;
- prepare recommendation: autonomous;
- create branch/change: bounded preparation;
- run tests: autonomous;
- create preview: bounded;
- open PR: bounded;
- merge: approval-controlled;
- production deploy: approval-controlled;
- modify client billing: not authorized.

This granular model is the basis of progressive autonomy.

---

# 25. Desired end state

JS OS should eventually make consequential action flow visible and explainable:

```text
Business Event / Goal
        ↓
Agent reasons
        ↓
WorkItem / ToolRequest
        ↓
Permission ceiling
        ↓
Policy evaluation
        ↓
Approval if required
        ↓
Tool adapter executes
        ↓
Validation
        ↓
Atomic terminal state + BusinessEvent
        ↓
AgentRun / provenance
        ↓
Business state changes
```

The objective is not to give AI unrestricted access to the company's accounts.

The objective is to create a controlled execution substrate where useful autonomy can increase without losing ownership, security, economic discipline, or accountability.