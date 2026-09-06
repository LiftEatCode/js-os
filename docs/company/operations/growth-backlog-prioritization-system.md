# Growth Backlog + Prioritization System v1

**Status:** Testable operating system v1

## Purpose

Define how JS Solutions converts observations, data, client requests, audit findings, competitive gaps, technical issues, and growth ideas into a controlled queue of business opportunities.

The backlog is not a task list. It is the decision system that determines what deserves client capacity next.

Core flow:

**Signal → Opportunity → Evidence → Business Objective → Impact → Confidence → Effort → Risk → Scope → Approval → Priority → Execute → Validate → Measure → Learn → Reprioritize**

The governing question is:

> Given the client's current business priorities, available evidence, engagement capacity, and risk, what is the highest-value work JS Solutions should do next?

---

## 1. Why the backlog exists

Without a controlled backlog, recurring service naturally becomes reactive:

**Client asks → founder does → tool reports issue → founder does → new idea appears → founder does**

That behavior makes scope, economics, priorities, and results difficult to control.

The backlog creates one place where competing opportunities are evaluated using the same business logic.

It should prevent:
- client requests automatically becoming top priority;
- SEO-tool warnings automatically becoming work;
- easy/countable tasks displacing higher-value work;
- AI-generated ideas creating artificial workload;
- large projects silently consuming recurring capacity;
- low-confidence experiments being presented as certainties;
- completed activity being confused with business value.

---

## 2. Backlog inputs

Opportunities may originate from:
- client onboarding;
- prospect/sales audit findings confirmed after onboarding;
- website analysis;
- Search Console/Analytics/GBP data where authorized;
- customer/lead data;
- client requests;
- client conversations;
- competitor/public-market observations;
- technical monitoring;
- conversion/lead-routing failures;
- reputation/trust signals;
- content/customer questions;
- seasonality/promotions;
- prior optimization results;
- JS Solutions strategic review;
- future agent recommendations.

Source does not determine priority. Evidence and business relevance do.

---

## 3. Opportunity versus task

An opportunity describes a business problem or plausible improvement before prescribing implementation.

Weak task:
> Rewrite brake page.

Better opportunity:
> The brake-service journey does not clearly communicate inspection/repair capability or give mobile visitors a strong call path despite brake work being a priority service.

Possible implementation may include copy, proof, CTA, internal links, schema, measurement, or another intervention.

Do not prematurely reduce an opportunity to the first task someone imagined.

---

## 4. Required opportunity record

Every meaningful backlog item should contain enough information to support a decision.

### Identity
- unique identifier;
- title;
- client;
- category;
- source;
- created date;
- status.

### Problem / opportunity
- observed condition;
- affected customer/business journey;
- business objective;
- evidence;
- evidence quality;
- expected mechanism;
- proposed intervention or next investigation.

### Decision dimensions
- impact;
- confidence;
- effort;
- risk;
- business relevance;
- urgency;
- revenue relevance where supportable;
- scope/tier fit;
- approval requirement;
- dependencies/blockers.

### Execution / learning
- selected plan;
- owner/actor;
- planned timing;
- implementation evidence;
- technical/business validation;
- measurement window;
- outcome classification;
- learning;
- follow-on opportunity if applicable.

Unknown fields remain unknown rather than being guessed.

---

## 5. Standard categories

Use these default categories:

### VISIBILITY
Search/local discoverability and customer demand capture.

Examples:
- missing priority service coverage;
- indexation issue;
- weak local/service architecture;
- underperforming high-value search journey.

### TRUST
Evidence that affects whether customers believe or choose the business.

Examples:
- weak owner/team proof;
- missing testimonials near decision points;
- conflicting business facts;
- stale/template content;
- underused credentials/case studies.

### CONVERSION
Friction between customer interest and contact/booking/purchase.

Examples:
- weak CTA;
- broken form;
- confusing service journey;
- poor mobile contact path;
- high-value page not answering buying questions.

### MEASUREMENT
Gaps that materially prevent useful decisions.

Examples:
- form submissions not tracked;
- calls indistinguishable;
- broken analytics events;
- inability to evaluate a major optimization.

### TECHNICAL
Technical health when it affects visibility, conversion, reliability, security, measurement, or maintainability.

Examples:
- broken redirects;
- production error;
- crawl issue;
- deployment instability;
- material performance problem.

### CONTENT
Content opportunity tied to an identified business/customer need.

Examples:
- service decision content;
- customer FAQ;
- proof/case study;
- priority educational content;
- promotion support.

### CLIENT_REQUEST
A client-originated request not yet categorized as a more specific opportunity.

The CLIENT_REQUEST category is an intake state, not automatic priority.

### SPECIAL_PROJECT
Work that may exceed normal recurring capacity or require separate commercial treatment.

Examples:
- major rebuild;
- substantial integration;
- event campaign;
- custom software;
- large migration.

---

## 6. Evidence model

Every opportunity should state why JS Solutions believes the problem/opportunity exists.

Classify supporting evidence as:

### MEASURED
Direct reliable data from an authorized source.

Examples:
- conversion event failure;
- Search Console query/page data;
- form submission records;
- measured performance failure.

### OBSERVED
Directly visible condition.

Examples:
- broken link;
- missing CTA;
- contradictory public business information;
- competitor visibly presents proof the client does not.

### CLIENT_CONFIRMED
Authorized client provides material business information.

Examples:
- service is high priority;
- capacity exists;
- certain lead type is low quality;
- customer frequently asks a particular question.

### INFERRED
Reasonable interpretation from available evidence, but not directly established.

Example:
> Weak proof near the estimate CTA may be contributing to decision friction.

### HYPOTHESIS
Plausible idea requiring further evidence/testing.

Do not present INFERRED or HYPOTHESIS evidence as measured fact.

---

## 7. Impact

Impact estimates how much the opportunity could matter if the expected mechanism is correct.

### CRITICAL
Materially broken customer acquisition, major public trust error, severe outage, dangerous measurement/lead-routing failure, or another issue requiring immediate evaluation.

### HIGH
Could materially affect a priority service, important customer journey, meaningful demand, conversion, trust, or decision quality.

### MEDIUM
Useful improvement with plausible business value but limited reach/value or less direct connection to current priorities.

### LOW
Minor/cosmetic/edge-case improvement unlikely to materially affect current business outcomes.

Impact is not effort. A five-minute fix can be high impact.

---

## 8. Confidence

Confidence estimates how strongly evidence supports the proposed diagnosis/intervention.

### HIGH
Multiple strong signals or direct measured/observed evidence support the action.

### MEDIUM
Reasonable evidence exists, but important uncertainty remains.

### LOW
Mostly inference/hypothesis or insufficient data.

Low-confidence opportunities are not forbidden. They should generally be investigated or tested before receiving large amounts of capacity.

---

## 9. Effort

Estimate total delivery burden, not only typing/coding time.

Include:
- research;
- implementation;
- review;
- approvals;
- testing;
- deployment;
- client coordination;
- measurement setup;
- likely rework.

### LOW
Usually achievable with a small amount of engagement capacity and limited coordination.

### MEDIUM
Meaningful work requiring planning/validation but appropriate for recurring capacity when sufficiently valuable.

### HIGH
Large work item likely to consume substantial recurring capacity or require multi-step coordination.

High effort should trigger a scope/Foundation/Plus check.

---

## 10. Risk

Risk describes consequence if the decision or implementation is wrong.

### LOW
Easy to reverse, limited blast radius, no consequential external effect.

### MEDIUM
Customer-facing or operational effect requiring review/validation but manageable rollback.

### HIGH
Could materially affect revenue, production, public claims, accounts, reputation, legal/privacy posture, paid spend, or customer communication.

### CRITICAL
Money/contracts/credentials/destructive/legal/accounting or similarly severe consequence. Human control is mandatory unless a future explicitly governed system says otherwise.

Risk affects controls, not necessarily business priority. A high-value high-risk opportunity may remain important but require stronger approval/validation.

---

## 11. Business relevance

Rate how directly the opportunity supports the client's current priorities.

### HIGH
Directly tied to a priority service, target market, known conversion problem, capacity objective, or critical business constraint.

### MEDIUM
Supports general acquisition/trust/measurement but is not central to the current objective.

### LOW
Weak connection to current business priorities.

This dimension prevents generic marketing checklists from dominating client capacity.

---

## 12. Urgency

Urgency is separate from impact.

### NOW
Waiting creates material business/customer/security/reputation harm.

Examples:
- site unavailable;
- lead form broken;
- materially wrong public phone/hours;
- active campaign sends users to broken page.

### SOON
Time-sensitive business value exists.

Examples:
- upcoming seasonal demand;
- approved promotion/event;
- service launch;
- expiring opportunity.

### NORMAL
Should compete through standard prioritization.

### LATER
Valid but intentionally deferred.

Do not let artificial urgency override evidence.

---

## 13. Revenue relevance

Revenue relevance is useful when evidence supports it, but should not become fabricated ROI.

Suggested values:
- DIRECT — directly affects an existing conversion/revenue path;
- STRONG — strongly connected to a priority commercial journey;
- INDIRECT — supports trust/visibility/measurement with less direct revenue connection;
- UNKNOWN — cannot responsibly estimate.

If customer/job value is known, it may inform priority. Do not invent expected revenue from ranking/traffic assumptions.

---

## 14. Scope / tier fit

Every item must be commercially classified before execution.

### CORE_CAPACITY
Appropriate for Local Growth System recurring capacity.

### PLUS_CAPACITY
Appropriate but complexity/volume fits Local Growth Plus.

### FOUNDATION
Substantial one-time prerequisite/foundation work.

### CUSTOM_PROJECT
Separate project/software/automation/campaign scope.

### OUT_OF_SCOPE
Not appropriate for the engagement/business.

### NEEDS_SCOPE_DECISION
Cannot yet classify.

Scope classification does not determine whether an idea is valuable. It determines how JS Solutions can responsibly deliver it.

---

## 15. Approval classification

Suggested approval states:
- NONE_REQUIRED;
- INTERNAL_REVIEW;
- CLIENT_APPROVAL;
- PRODUCTION_APPROVAL;
- BUDGET_APPROVAL;
- HUMAN_ONLY;
- NOT_YET_DETERMINED.

Approval requirement should reflect the Tool Catalog and Website Optimization System where applicable.

Approval authorizes a defined action; it does not automatically increase its priority or prove the action is correct.

---

## 16. Dependencies and blockers

Record dependencies explicitly.

Examples:
- client fact confirmation;
- missing Analytics/Search Console/GBP access;
- photography/brand asset;
- approved offer/pricing;
- another backlog item;
- vendor action;
- production access;
- sufficient observation period;
- Foundation completion.

Blocked work should not repeatedly appear as the current priority unless resolving the blocker itself is the priority.

---

## 17. Priority decision model

Avoid fake mathematical precision during early validation.

Use a structured judgment sequence:

### Gate 1 — Is it real enough?
- Is there evidence?
- Is the condition material?
- Is the diagnosis distinguishable from an idea?

If not, gather evidence or leave as hypothesis.

### Gate 2 — Does it matter to the business now?
Evaluate impact, business relevance, urgency, and revenue relevance.

### Gate 3 — How likely are we to be right?
Evaluate confidence and whether a smaller test could increase confidence.

### Gate 4 — What does it cost?
Evaluate effort, client coordination, and recurring capacity.

### Gate 5 — What can go wrong?
Evaluate risk, reversibility, approval, and validation requirements.

### Gate 6 — Does it fit the engagement?
Classify Core/Plus/Foundation/Custom/Out-of-scope.

### Gate 7 — Is this the best next use of capacity?
Compare against the other ready opportunities, not against doing nothing.

---

## 18. Priority bands

After structured judgment, assign one operating band.

### P0 — Immediate operational issue
Critical/urgent issue that threatens existing customer acquisition, trust, measurement, production, or another material business function.

P0 interrupts planned work only when justified.

### P1 — Highest-value next work
Strong evidence/business relevance and worth near-term capacity.

The active monthly plan should be dominated by a small number of P1 items.

### P2 — Valuable queued opportunity
Legitimate work but lower current value, confidence, urgency, or fit than P1.

### P3 — Explore / low-confidence
Potentially useful but requires evidence, testing, or more business relevance.

### P4 — Parked / low-value
Valid observation that should not consume current capacity.

### REJECTED
Not worth pursuing, duplicate, disproven, unethical, outside competence, or otherwise intentionally closed.

Priority is dynamic. New evidence may raise or lower it.

---

## 19. Tie-breaking rules

When opportunities appear similarly valuable, prefer in this order when context does not dictate otherwise:

1. protect existing customer demand/conversion;
2. repair broken lead/measurement systems;
3. improve high-value priority-service journeys;
4. resolve material trust/reputation friction;
5. capture demonstrated search/local demand;
6. improve measurement needed for future decisions;
7. pursue evidence-backed expansion;
8. run bounded experiments;
9. cosmetic/low-impact optimization.

Prefer smaller reversible tests when they can cheaply answer an important uncertainty before committing large effort.

---

## 20. Client request handling

Client requests enter the same system as other opportunities.

Respond internally by asking:
- What problem is the client trying to solve?
- Is the requested implementation actually the best solution?
- Is it urgent?
- What evidence exists?
- What business objective does it support?
- Does it fit scope/capacity?
- What would be displaced if we do it now?

Possible outcomes:
- prioritize as P0/P1;
- add to normal backlog;
- investigate first;
- recommend a better intervention;
- trade against current capacity;
- classify as Plus/Foundation/Custom;
- decline/defer with explanation.

Client importance is respected without converting the service into unlimited task fulfillment.

---

## 21. AI / agent-generated opportunities

AI can create near-infinite plausible ideas. Therefore AI-generated volume must not create backlog volume by default.

A future agent should only promote an idea into the meaningful backlog when it can attach:
- evidence;
- business objective;
- expected mechanism;
- confidence;
- affected journey;
- preliminary impact/effort/risk assessment.

Low-evidence machine observations may remain in an analysis buffer rather than polluting the operating backlog.

The goal is fewer better opportunities, not thousands of generated tasks.

---

## 22. Backlog statuses

Suggested lifecycle:
- OBSERVED;
- NEEDS_EVIDENCE;
- READY_FOR_PRIORITIZATION;
- PRIORITIZED;
- PLANNED;
- WAITING_APPROVAL;
- BLOCKED;
- IN_PROGRESS;
- VALIDATING;
- MEASURING;
- COMPLETED;
- DEFERRED;
- REJECTED;
- SUPERSEDED.

Completion means implementation/required validation is complete. It does not necessarily mean business impact is proven.

A completed item may remain in MEASURING until enough evidence exists for a learning classification.

---

## 23. Work-in-progress limits

Do not maximize simultaneous work.

For a typical core client, prefer a small number of active meaningful opportunities rather than many partially completed items.

Working rule during validation:
- 1–3 primary P1 workstreams at a time;
- P0 may interrupt when justified;
- keep investigation separate from implementation;
- finish/validate before continuously starting new work.

Actual limits should be refined using delivery evidence.

---

## 24. Capacity planning

At the beginning of each execution cycle:
1. estimate available engagement capacity;
2. reserve reasonable capacity for validation/measurement/client coordination;
3. select the best ready P1 work;
4. do not fill capacity with P2/P3 merely to stay busy;
5. identify any large item requiring commercial escalation.

For the $1,500 core tier, the mature model should trend toward roughly 4–5 founder-equivalent hours/month or less, subject to direct AI/software costs and real delivery evidence.

Early standardized clients may temporarily consume more while systems are learned.

---

## 25. Planned versus reactive work

Track whether completed work was:
- PLANNED_GROWTH;
- CLIENT_REQUEST;
- INCIDENT/REPAIR;
- OPPORTUNISTIC;
- SPECIAL_PROJECT.

This reveals whether the engagement is actually operating strategically or being consumed by reactive support.

A persistently high reactive share should trigger investigation into client quality, platform reliability, scope, onboarding, or communication.

---

## 26. Execution handoff

When an item becomes PLANNED, define:
- desired outcome;
- exact implementation scope;
- actor;
- dependencies;
- approval state;
- validation plan;
- rollback/recovery where applicable;
- measurement plan;
- capacity estimate.

For website work, follow the Website Optimization System rather than duplicating its implementation controls.

For external/account actions, follow the Tool Catalog, permission, policy, and approval model.

---

## 27. Validation

Validation has two distinct meanings.

### Implementation validation
Did the work execute correctly?

Examples:
- build/tests pass;
- form works;
- tracking event fires;
- page renders;
- GBP change reflects approved fact;
- no regression introduced.

### Business validation
Did the expected mechanism appear to produce useful change?

Examples:
- conversions improved;
- priority page gained relevant search demand;
- lead routing recovered;
- customer friction decreased;
- client reports better lead quality.

A technically successful change can have no measurable business impact.

---

## 28. Measurement and learning

After an appropriate observation period, classify outcome:
- VALIDATED_POSITIVE;
- LIKELY_POSITIVE;
- INCONCLUSIVE;
- NO_OBSERVED_IMPACT;
- NEGATIVE;
- MEASUREMENT_FAILED;
- NOT_MEASURABLE.

Record:
- result/evidence;
- interpretation confidence;
- confounding factors;
- what was learned;
- whether to expand, revise, revert, stop, or create a follow-on opportunity.

Do not convert correlation into certainty.

---

## 29. Reprioritization cadence

The backlog should be reconsidered:
- during onboarding;
- at the start of each recurring cycle;
- when material new data appears;
- when client priorities/capacity change;
- after important optimization results;
- when a P0 incident occurs;
- before committing major capacity;
- during monthly client review.

Do not continuously reshuffle priorities because of minor signals.

---

## 30. Monthly client review relationship

The backlog should make the client review easy to explain.

Client-facing narrative:
1. What business objective are we working toward?
2. What did the evidence show?
3. Which opportunities did we prioritize and why?
4. What did we implement?
5. What happened?
6. What did we learn?
7. What are the highest priorities now?
8. What client decisions/access are needed?

Do not expose an overwhelming raw backlog unless useful. Translate it into business decisions.

---

## 31. Tha Shop application

Tha Shop should be the first live environment for testing this model.

New meaningful Tha Shop work should be internally classified using:
- category;
- source;
- evidence;
- impact;
- confidence;
- effort;
- risk;
- business relevance;
- priority band;
- planned/reactive type;
- outcome/learning where measurable.

This does not require changing the existing client relationship. It converts ongoing work into evidence about whether the prioritization model reflects reality.

Watch specifically for:
- high-volume social/content requests;
- event/promotional work;
- website maintenance;
- SEO opportunities;
- client-request interruptions;
- technical incidents;
- work that would exceed future $1,500 core capacity.

---

## 32. Metrics for validating the backlog system

For the first standardized clients, track:

### Backlog quality
- opportunities created;
- percentage with usable evidence;
- percentage rejected/deferred;
- P1 count;
- average age of P1 items;
- duplicate/low-value opportunity rate.

### Delivery behavior
- planned vs reactive work share;
- founder-equivalent hours by category;
- WIP count;
- blocked time;
- approval delays;
- scope escalations.

### Decision quality
- P1 outcomes by learning classification;
- percentage of P1 items producing positive/likely-positive result;
- negative/reverted changes;
- measurement failure rate;
- low-confidence experiments that became validated opportunities.

### Economics
- capacity consumed per completed opportunity;
- direct AI/software cost where attributable;
- special-project work discovered;
- recurring work that repeatedly exceeds tier economics.

Do not optimize these metrics independently of client outcomes.

---

## 33. Anti-patterns

Do not:
- use one universal numeric score as unquestionable truth;
- fabricate ROI/revenue estimates;
- let crawler warning counts determine priority;
- create backlog items for every possible AI suggestion;
- mark a task high priority because the client mentioned it most recently;
- hide scope problems by repeatedly overdelivering;
- confuse urgency with importance;
- execute consequential changes without approval;
- mark implementation success as business success;
- keep dead opportunities forever;
- create dozens of active workstreams;
- prioritize tasks because they make monthly reports look busy.

---

## 34. Optional future scoring model

After enough real client data exists, JS Solutions may test a bounded numerical ranking aid.

Possible dimensions:
- impact;
- confidence;
- business relevance;
- urgency;
- effort penalty;
- risk/control penalty;
- revenue relevance.

Any score must remain explainable and subordinate to explicit operating gates.

Do not introduce decimal precision that the evidence cannot support.

The initial manual bands (P0–P4) are intentionally preferred until delivery data demonstrates that a formula improves decisions.

---

## 35. Future JS OS contract

This system is the manual specification for future opportunity/backlog reasoning.

Future JS OS may:
- ingest observations from authorized tools/agents;
- deduplicate related signals;
- distinguish observations from actionable opportunities;
- attach evidence;
- classify categories;
- estimate impact/confidence/effort/risk;
- connect opportunities to business goals;
- identify scope/approval requirements;
- recommend priority bands;
- surface blockers/dependencies;
- calculate available client capacity;
- prepare execution plans;
- track validation/measurement;
- learn from prior outcomes;
- surface scope/economic problems.

Important boundary:

> The system may recommend what should happen next. Execution authority still comes from tools, permissions, policies, approvals, and the applicable client scope.

The backlog must not become a path around the Tool Execution Boundary.

---

# Core principle

> The backlog exists to protect client value and JS Solutions capacity from noise.

A good backlog does not contain the most ideas.

It makes the best next decision obvious enough to explain:

**Why this problem is real → why it matters now → why this intervention is plausible → what it costs/risks → why it beats the alternatives → what evidence will tell us whether it worked.**