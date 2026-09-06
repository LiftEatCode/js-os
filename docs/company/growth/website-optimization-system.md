# Website Optimization System v1

**Status:** Operating hypothesis v1

## Purpose

Define how JS Solutions evaluates, prioritizes, prepares, implements, validates, deploys, and measures website improvements for clients.

The governing loop is:

**Analyze → Identify Opportunities → Prioritize → Plan → Prepare → Approve → Implement → Validate → Deploy → Measure → Learn → Repeat**

The system exists to improve business outcomes, not to maximize the number of website changes completed.

## 1. Core principle

A website optimization is valuable only when it plausibly improves one or more of:

- visibility;
- trust;
- conversion;
- measurement;
- operational clarity;
- maintainability/reliability where that affects customer acquisition.

Do not optimize simply because a tool reports a warning.

## 2. Inputs

A website review may use:

### Business inputs
- priority services;
- target customers;
- target markets;
- customer/job value where known;
- capacity constraints;
- seasonality;
- business goals;
- approved offers and claims.

### Website inputs
- public website content;
- sitemap/navigation;
- page architecture;
- metadata;
- schema;
- internal links;
- forms/CTAs;
- mobile experience;
- performance/reliability;
- analytics/tracking implementation;
- CMS/repository architecture where authorized.

### Search/local inputs
- Search Console where authorized;
- Google Analytics where authorized;
- Google Business Profile where authorized;
- public search results;
- competitor websites;
- local/service intent patterns.

### Client evidence
- lead quality;
- common customer questions;
- sales objections;
- service margins/priorities;
- calls/forms/bookings;
- operational limits.

Unavailable inputs remain unavailable. Do not invent them.

## 3. Analysis domains

Every website review should consider the following domains, but depth should follow business relevance.

### Visibility
Questions:
- Can search engines understand the business, services and markets?
- Are priority services represented by appropriate pages?
- Is content aligned with real customer/search intent?
- Are metadata, internal links and schema supporting important pages?
- Are indexing/crawl issues limiting discoverability?

### Trust
Questions:
- Does the site communicate why a customer should trust this business?
- Are owner/team/experience/licensing/certification claims clear and consistent?
- Is customer proof close to the decisions it supports?
- Are there stale/template/placeholder/conflicting elements that damage credibility?
- Are public business facts consistent?

### Conversion
Questions:
- Is the next action obvious?
- Can mobile visitors quickly call/request/book?
- Do high-value service pages answer buying questions?
- Are forms unnecessarily difficult?
- Do CTAs match customer intent?
- Are offers, financing, warranties or emergency availability presented accurately where useful?

### Information architecture
Questions:
- Can users quickly understand services and locations?
- Are high-value services buried or bundled too broadly?
- Is navigation logical?
- Are pages duplicated or competing with one another?
- Are service/location pages justified rather than created as thin SEO inventory?

### Content quality
Questions:
- Is content accurate, useful and specific to the business?
- Does it demonstrate real expertise/evidence?
- Are there generic/template/AI-like sections that weaken credibility?
- Is the content written for customer decisions rather than keywords alone?

### Technical health
Questions:
- Are important pages crawlable/indexable?
- Are canonical/redirect/status behaviors correct?
- Are there broken links/forms/assets?
- Is the site reliably usable on mobile?
- Are performance issues material enough to affect experience/search?
- Are deployments/builds maintainable and testable?

### Measurement
Questions:
- Are calls/forms/bookings measurable where technically and legally appropriate?
- Are Analytics/Search Console configured correctly?
- Can key conversion actions be distinguished?
- Can future changes be evaluated against a baseline?

## 4. Opportunity record

Every meaningful website opportunity should be recorded as a decision item, not an isolated task.

Recommended fields:

- title;
- problem/opportunity;
- evidence;
- affected page(s)/journey;
- business objective;
- proposed change;
- expected mechanism;
- impact;
- confidence;
- effort;
- risk;
- revenue relevance where genuinely supported;
- dependencies;
- approval requirement;
- validation method;
- measurement plan;
- status;
- outcome/learning.

## 5. Prioritization model

Use these primary dimensions:

### Impact
How much could the opportunity matter to visibility, trust, conversion, measurement or business value?

- High
- Medium
- Low

### Confidence
How strong is the evidence that the proposed change addresses a real issue?

- High
- Medium
- Low

### Effort
What delivery effort is required relative to available capacity?

- Low
- Medium
- High

### Risk
What is the consequence if the change is wrong or implementation fails?

- Low
- Medium
- High

### Business relevance
How directly does it connect to the client's current priority services/customers/markets?

- High
- Medium
- Low

Optional internal numerical models may be added later, but avoid fake precision. A 7.82 priority score is not inherently more truthful than a well-supported High Impact / High Confidence decision.

## 6. Priority rules

Generally prioritize:

1. broken conversion/trust/reliability issues affecting existing demand;
2. high-value service/customer journeys with strong evidence;
3. measurement gaps that prevent useful decision-making;
4. material technical/indexation blockers;
5. service/local content/architecture opportunities;
6. lower-confidence experiments;
7. cosmetic or low-business-impact work.

Exceptions are allowed when business context justifies them.

Avoid prioritizing work because:
- a crawler produced the most warnings;
- the task is easy to count;
- a competitor has a page and therefore the client must have one;
- AI can generate it cheaply;
- an SEO checklist says every site should have it.

## 7. Change classes

Classify proposed changes by consequence and required control.

### Class 1 — Recommendation only
AI/system may identify and explain the opportunity but does not prepare a production change.

Examples:
- strategic navigation changes;
- significant positioning changes;
- business-priority questions requiring owner input;
- unsupported service/location expansion ideas.

### Class 2 — Prepare, human approves
System may prepare copy/code/config changes, but a human approves before implementation or deployment.

Examples:
- service-page rewrites;
- metadata changes;
- schema changes;
- CTA changes;
- new page drafts;
- meaningful internal-link restructuring.

### Class 3 — Implement in controlled workspace, deployment approval required
System may make approved changes in a branch/draft/staging environment and run validation, but cannot publish to production without approval.

Examples:
- code edits;
- new components/pages;
- technical SEO fixes;
- analytics instrumentation;
- larger content/template changes.

### Class 4 — Approved autonomous routine change
Only after policy, tooling, client authorization and demonstrated reliability exist.

Potential future examples:
- fixing a broken internal link;
- correcting approved metadata formatting;
- low-risk content formatting;
- routine schema sync from approved business facts.

Class 4 is a future autonomy state, not the default.

## 8. Approval triggers

Require explicit client/human approval when a change affects:

- pricing;
- offers/promotions;
- warranties/guarantees;
- licensing/legal claims;
- service availability;
- business hours/contact information unless correcting against verified source of truth;
- major brand positioning;
- new service claims;
- material navigation/site architecture;
- production deployment with meaningful risk;
- paid tools/spend;
- analytics/privacy/consent behavior;
- third-party integrations;
- customer-facing forms/workflows;
- content that could create legal/reputational exposure.

Approval authorizes the change. It should not erase the requirement for technical validation.

## 9. Planning a change

Before implementation, define:

- desired outcome;
- exact scope;
- pages/files/systems affected;
- dependencies;
- rollback path where applicable;
- testing/validation method;
- approval state;
- deployment method;
- measurement plan.

Small low-risk changes may use a lightweight plan. High-risk changes require more detail.

## 10. Implementation workflow

For code-based sites:

**Approved opportunity → Branch/workspace → Change → Local/static validation → Build/tests → Review → Preview/staging → Approval if required → Production deployment**

For CMS/page-builder sites:

**Approved opportunity → Draft/staging/versioned edit → Review → Validation → Approval → Publish**

Do not edit production directly when a safer preview/staging/versioned workflow is reasonably available.

## 11. Technical validation

Validation should match the change.

Potential checks:
- build passes;
- lint/type checks pass where available;
- relevant automated tests pass;
- page renders correctly;
- mobile layout works;
- links are valid;
- forms/CTAs function;
- metadata/schema output is correct;
- canonical/index directives are correct;
- analytics events fire as intended;
- redirects/status codes behave correctly;
- no unintended page/content loss;
- accessibility regressions are not introduced;
- performance does not materially degrade.

A successful deployment is not proof that the optimization was successful. It only proves implementation reached production.

## 12. Business validation

After deployment, determine whether the change produced the expected mechanism.

Examples:

### Conversion change
Measure where possible:
- CTA clicks;
- calls/forms/bookings;
- conversion rate;
- lead quality.

### Search/content change
Measure where possible:
- indexing;
- impressions;
- relevant queries;
- clicks;
- landing-page engagement/conversions;
- local visibility signals.

### Trust change
May require indirect evidence such as:
- conversion changes;
- sales/customer feedback;
- reduced friction;
- stronger engagement;
- explicit client observations.

Do not claim causality when multiple variables changed or sample sizes are too small.

## 13. Experiment design

Not every optimization should be treated as a formal A/B test.

Use controlled experimentation when:
- traffic is sufficient;
- measurement is reliable;
- variants can be isolated;
- decision value justifies the complexity.

For low-traffic local businesses, use practical before/after evidence and longer observation windows while acknowledging uncertainty.

## 14. Learning record

After enough observation, classify the result:

- VALIDATED_POSITIVE;
- LIKELY_POSITIVE;
- INCONCLUSIVE;
- NO_OBSERVED_IMPACT;
- NEGATIVE;
- MEASUREMENT_FAILED.

Record:
- what changed;
- what happened;
- confidence in interpretation;
- what the result changes about future priorities.

A failed or inconclusive optimization is useful if the learning is preserved.

## 15. Continuous optimization cadence

The client website should not be treated as a one-time project after launch.

Recurring loop:

**Business priorities → Website/search data → Opportunity backlog → Highest-value change → Validation → Measurement → New evidence → Reprioritize**

This is the website-specific implementation of the broader Client Growth System.

## 16. Website optimization economics

Optimization effort must remain compatible with engagement economics.

Before selecting a large change, ask:
- Is this the highest-value use of available client capacity?
- Could a smaller intervention test the hypothesis first?
- Is this Foundation/project work rather than recurring optimization?
- Is custom software/build work outside current scope?
- Does the expected business relevance justify the effort?

Do not consume a month's recurring capacity rebuilding an entire website unless that scope was intentionally approved/priced.

## 17. Website rebuild trigger

Recommend a larger Foundation/rebuild project only when incremental optimization is structurally inefficient.

Potential signals:
- architecture fundamentally blocks priority services;
- platform is unstable/unmaintainable;
- critical mobile/conversion problems are systemic;
- analytics/forms cannot be reliably repaired incrementally;
- template/technical debt makes repeated work excessively expensive;
- client needs material brand/content architecture changes beyond recurring capacity.

A dated-looking design alone does not automatically justify a rebuild.

## 18. Client communication

Explain website work in business language.

Weak:
> We changed H1s, schema, title tags and internal anchors.

Better:
> We strengthened the AC repair page around the service and market you want to grow, added proof closer to the call decision, clarified the primary CTA, and improved how search engines understand that page. We'll watch the page's search demand and conversions before deciding whether to expand the pattern to other services.

Technical details remain available, but the client-facing story should connect work to decisions and outcomes.

## 19. Future Website Optimization Agent

The future agent should operate inside this lifecycle:

**Client Website → Observe → Detect Opportunity → Build Evidence → Score/Prioritize → Recommend → Prepare Change → Request Required Approval → Execute Through Authorized Tool → Validate → Request Deployment Approval Where Required → Deploy Through Authorized Tool → Measure → Learn**

The agent should not be defined as “AI that can edit websites.” Its job is to improve customer-acquisition outcomes through controlled website optimization.

## 20. Agent permission boundaries

A future Website Optimization Agent may eventually be able to:

### Reason autonomously
- analyze pages/data;
- identify opportunities;
- compare competitors;
- prioritize backlog;
- prepare plans;
- estimate risk/effort;
- recommend validation methods.

### Prepare autonomously
- draft copy;
- prepare metadata/schema;
- prepare code changes;
- prepare branches/PRs where authorized;
- prepare test/validation reports.

### Execute only through tools and permissions
- repository edits;
- CMS edits;
- analytics changes;
- deployment actions;
- Search Console/GBP actions;
- external account mutations.

### Require approvals according to policy
- consequential content claims;
- major architecture changes;
- production deployment;
- customer-facing data changes;
- high-risk external actions.

The reasoning agent never bypasses the tool/permission/approval boundary.

## 21. Required audit trail

For every material automated optimization, preserve:
- source evidence;
- opportunity/recommendation;
- reasoning summary sufficient for review;
- proposed change;
- approvals;
- tool/action used;
- implementation result;
- validation result;
- deployment state;
- measurement result;
- eventual learning/outcome.

This creates a defensible history of why the business website changed.

## 22. Success criteria

Website Optimization System v1 is successful if it helps JS Solutions consistently:

- identify the highest-value website opportunities;
- avoid low-value task churn;
- preserve client/business accuracy;
- control risky changes;
- implement safely;
- validate technically;
- measure business outcomes where possible;
- learn from results;
- deliver within engagement economics;
- provide a clear contract for future JS OS automation.
