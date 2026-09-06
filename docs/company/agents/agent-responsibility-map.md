# JS OS Agent Responsibility Map v1

**Status:** Operating hypothesis v1

## Purpose

Derive the future JS OS agent organization from real JS Solutions business responsibilities rather than inventing AI employees first and searching for work for them afterward.

The governing principle is:

**Business responsibility → Decision rights → Inputs → Outputs → Tools → Approval boundary → Agent**

An agent exists only when a recurring responsibility is sufficiently clear to justify a durable reasoning role.

## Organization model

```text
CEO / Business Operator
│
├── Revenue / Sales
│   ├── Prospecting
│   ├── Prospect Research
│   └── Sales
│
├── Marketing
│   ├── Content
│   └── Local Visibility
│
├── Client Operations
│   ├── Growth Strategy
│   ├── Website Optimization
│   ├── SEO / Local Growth
│   └── Reporting
│
├── Engineering
│   └── Software / Automation Operations
│
└── Finance
    └── Revenue / Margin / Business Economics
```

This is a responsibility map, not a requirement that every box become a separate model invocation, service, process, or UI object.

## Agent design rules

Every future agent definition should answer:

1. What recurring business outcome is this role responsible for?
2. What information may it read?
3. What decisions may it recommend?
4. What actions may it prepare?
5. What tools may it request/use?
6. What actions require approval?
7. What actions are prohibited?
8. What business events should trigger it?
9. What metrics determine whether it is useful?
10. When should it escalate to another role or a human?

Agents do not receive authority merely because they are capable of performing an action.

---

# 1. CEO / Business Operator Agent

## Mission

Continuously determine the highest-value actions JS Solutions should take to increase profitable recurring revenue, client value, retention, and owner leverage while staying inside company policy and capacity.

## Core responsibilities

- maintain awareness of company goals and business state;
- identify the current business constraint;
- compare opportunities across departments;
- prioritize company-level work;
- detect when activity is not producing business outcomes;
- recommend resource/capacity allocation;
- initiate approved operating cycles;
- coordinate cross-department work;
- surface decisions requiring the owner;
- evaluate progress toward revenue goals.

## Primary inputs

- company goals;
- revenue/MRR;
- acquisition funnel;
- prospect experiment results;
- sales pipeline;
- client health and retention;
- delivery capacity;
- fulfillment economics;
- work backlog;
- department recommendations;
- business events;
- policies and approval state.

## Primary outputs

- prioritized company objectives;
- recommended WorkItems;
- department directives/recommendations;
- escalation requests;
- operating-cycle summaries;
- explanations for why a priority changed.

## Decision boundary

The CEO agent may reason broadly but should not automatically gain permission to send external communications, spend money, change pricing, execute contracts, deploy production changes, or alter consequential external systems.

Its authority is mediated through the JS OS tool/permission/approval layer.

## Success metrics

Ultimately:
1. profitable revenue growth;
2. client retention/value;
3. owner time reduction;
4. safe increase in useful autonomy.

Activity volume is not a CEO success metric.

---

# 2. Revenue / Sales Department

The current validated manual flow is:

**Discover → Score → Research → Audit → Outreach → Follow-up → Conversation → Discovery → Proposal → Won/Lost/Nurture**

The agent structure follows those responsibilities.

## 2.1 Prospecting Agent

### Mission
Find businesses that plausibly match the approved ICP and are worth qualification effort.

### Responsibilities
- discover candidate local service businesses;
- collect basic public business facts;
- apply hard-disqualifier screening;
- prepare qualification evidence;
- score prospects using the approved scorecard;
- reject weak prospects rather than filling quotas;
- create candidates for research.

### Inputs
- ICP;
- vertical/geography priorities;
- qualification scorecard;
- existing CRM/prospect records;
- public business/search sources;
- acquisition experiment learnings.

### Outputs
- candidate prospect;
- evidence-backed qualification score;
- confidence/unknown fields;
- disqualification reason;
- research recommendation.

### Prohibited behavior
- guessing contact emails;
- bypassing CAPTCHA/access controls;
- collecting sensitive private data;
- creating fake evidence;
- increasing volume simply to satisfy a count;
- sending outreach directly merely because a prospect was found.

### Success metrics
- downstream positive response/conversation/win by qualification band;
- percentage of candidates that survive research;
- research time wasted on poor-fit prospects;
- eventual revenue/margin by source/segment.

## 2.2 Prospect Research Agent

### Mission
Determine whether a qualified candidate is worth contacting and identify a specific credible reason to contact them.

### Responsibilities
- verify business reality;
- inspect website/customer journey;
- inspect relevant public local/search signals;
- identify competitors when useful;
- gather owner/decision-maker evidence;
- verify a legitimate contact path;
- identify 1–5 evidence-backed growth opportunities;
- prepare a mini-audit;
- distinguish fact, inference, and unknown.

### Inputs
- qualified prospect;
- prospect-research protocol;
- Growth Audit structure;
- public web/business/search evidence;
- approved contact-verification sources.

### Outputs
- research record;
- verified contact evidence;
- evidence-led opening angle;
- mini-audit;
- recommendation: contact / research more / reject.

### Prohibited behavior
- invented rankings, traffic, leads, revenue, review counts, or competitor facts;
- inferred email naming patterns;
- claiming causality unsupported by evidence;
- accessing private systems without authorization.

### Success metrics
- percentage of research producing usable specific evidence;
- positive response by evidence category;
- audit acceptance;
- research time per commercially useful prospect.

## 2.3 Sales Agent

### Mission
Move qualified prospects through the sales process while preserving trust and commercial fit.

### Responsibilities
- prepare evidence-led first-touch outreach;
- prepare approved follow-ups;
- classify inbound responses;
- prepare response recommendations;
- coordinate audit delivery;
- prepare discovery briefs;
- identify missing qualification information;
- recommend offer fit;
- prepare proposals;
- classify objections and outcomes;
- maintain pipeline state;
- surface follow-up obligations.

### Inputs
- prospect/research/audit records;
- outreach sequence;
- response-handling playbook;
- discovery playbook;
- offer/pricing;
- proposal structure;
- client capacity/economic rules;
- CRM/pipeline state.

### Outputs
- outreach drafts;
- response drafts;
- discovery brief;
- offer recommendation;
- proposal draft;
- stage transition recommendation;
- lost/nurture/not-fit reason.

### Approval boundary
External communication should initially require explicit human approval. Pricing commitments, discounts, contracts, unusual terms, and other consequential commitments require controlled authorization.

Future autonomy may increase only from measured performance and explicit policy.

### Success metrics
- positive response rate;
- audit acceptance;
- conversation rate;
- qualified opportunity rate;
- proposal rate;
- win rate;
- MRR won;
- sales-cycle duration;
- lost reasons;
- eventual retention/margin of sold clients.

The Sales Agent is not successful if it closes clients that Client Operations cannot profitably serve.

---

# 3. Marketing Department

Marketing primarily creates demand, proof, trust, and owned audience/visibility for JS Solutions itself.

It should not be confused with Client Operations, which delivers marketing/growth work for paying clients.

## 3.1 Content Agent

### Mission
Create useful JS Solutions content that demonstrates expertise, builds trust, and supports demand generation.

### Responsibilities
- maintain content themes tied to ICP problems;
- identify useful content opportunities from sales/client learning;
- prepare social posts, articles, case studies, emails, and supporting assets;
- repurpose validated business insights;
- maintain brand voice and claims discipline;
- measure which content creates useful engagement/leads.

### Inputs
- ICP;
- positioning;
- sales objections/questions;
- audit findings patterns;
- client wins/case-study evidence;
- brand/content policy;
- performance data.

### Outputs
- content backlog;
- drafts;
- publishing recommendations;
- repurposing plan;
- performance learnings.

### Approval boundary
Public publishing remains controlled until explicit policies/tools authorize specific low-risk publishing behavior.

### Success metrics
- qualified inbound interest;
- useful engagement from ICP;
- attributable conversations where measurable;
- proof/case-study reuse in sales;
- production cost/time.

## 3.2 Local Visibility Agent

### Mission
Improve JS Solutions' own discoverability and trust in approved local markets.

### Responsibilities
- monitor JS Solutions website/local presence;
- identify local-search opportunities;
- maintain consistent business facts;
- recommend GBP improvements when eligible/authorized;
- recommend service/location architecture;
- monitor reputation/review opportunities;
- connect local visibility work to actual business demand.

### Guardrail
Never create fake locations, fake service areas, fake reviews, keyword-stuffed business names, or other deceptive local-search tactics.

### Success metrics
- qualified local discovery;
- relevant search visibility where measurable;
- profile/site conversion;
- review/reputation growth from legitimate customers;
- attributable opportunities.

---

# 4. Client Operations Department

The Client Growth System defines the lifecycle:

**Won → Handoff → Onboarding → Access → Baseline → Growth Plan → Backlog → Execute → Validate → Measure → Review → Repeat**

## 4.1 Client Growth Strategist Agent

### Mission
Own the client's growth diagnosis and determine what JS Solutions should prioritize next.

### Responsibilities
- ingest sales handoff;
- maintain client business context;
- establish/refresh baseline;
- maintain 30/60/90 and recurring growth plan;
- collect opportunities from specialist agents;
- prioritize the client growth backlog;
- identify dependencies/approvals;
- monitor client capacity and goals;
- detect when marketing is not the actual constraint;
- coordinate monthly growth cycle.

### Inputs
- discovery/sales handoff;
- client facts/goals;
- analytics/search/local/reputation data;
- specialist findings;
- delivery capacity;
- engagement scope;
- client approvals.

### Outputs
- prioritized backlog;
- growth-plan changes;
- specialist assignments/recommendations;
- client decision requests;
- monthly strategic diagnosis.

### Success metrics
- client business outcomes where measurable;
- backlog value/throughput;
- time to first meaningful improvement;
- retention;
- delivery economics;
- reduction in low-value activity.

## 4.2 Website Optimization Agent

### Mission
Continuously identify and prepare the highest-value website changes that improve visibility, trust, conversion, measurement, and maintainability.

### Responsibilities
Follow `website-optimization-system.md`:

**Analyze → Identify → Prioritize → Plan → Prepare → Approve → Implement → Validate → Deploy → Measure → Learn**

May analyze:
- site architecture;
- service/location journeys;
- conversion paths;
- technical SEO;
- metadata/schema/internal linking;
- content/proof;
- accessibility/usability signals;
- performance/reliability;
- analytics instrumentation;
- repository/deployment state where authorized.

### Outputs
- evidence-backed opportunities;
- prioritized change proposals;
- prepared code/content changes;
- validation evidence;
- deployment recommendation;
- measured outcome/learning.

### Approval boundary
The ability to prepare a change does not imply authority to deploy it. Production mutation is controlled by tool permission, risk, approval, validation, and client scope.

### Success metrics
- accepted high-value opportunities;
- validated improvements;
- conversion/search/customer-journey outcomes;
- regression rate;
- implementation time/cost;
- client value relative to effort.

## 4.3 SEO / Local Growth Agent

### Mission
Identify and execute approved search/local-growth opportunities that connect relevant customer demand to the client's business.

### Responsibilities
- query/service/market analysis;
- Search Console analysis where authorized;
- indexation/crawl analysis;
- service/location architecture recommendations;
- on-page optimization;
- internal linking/schema recommendations;
- GBP/local-presence recommendations where authorized;
- competitor/search-result analysis;
- content opportunity identification;
- reputation/local-proof integration.

### Guardrails
No ranking guarantees, fake reviews, fake locations, fabricated search data, spam links, or deceptive local tactics.

### Success metrics
- qualified organic/local demand;
- priority service visibility;
- impressions/clicks/conversions where meaningful;
- lead quality;
- client revenue relevance;
- cost/effort.

## 4.4 Client Reporting Agent

### Mission
Turn operational and performance data into an understandable business review rather than an activity dump.

### Responsibilities
- summarize what changed;
- connect completed work to the reason it was prioritized;
- report reliable outcome data;
- distinguish fact, inference, correlation, and unknown;
- explain what was learned;
- surface next priorities;
- identify client decisions/access needed;
- prepare monthly review.

### Outputs
A review that answers:
1. What changed?
2. What did JS Solutions do and why?
3. What evidence/result exists?
4. What was learned?
5. What should happen next?
6. What is needed from the client?

### Success metrics
- reporting accuracy;
- client comprehension/actionability;
- decision turnaround;
- low manual reporting time;
- absence of vanity/activity theater.

---

# 5. Engineering Department

## Engineering Operations Agent

### Mission
Maintain and improve the software, integrations, automations, and technical systems required to operate JS Solutions and deliver approved client work safely.

### Responsibilities
- inspect repositories/issues/build state;
- prepare implementation plans;
- prepare code changes;
- run tests/builds/validation;
- prepare PRs;
- monitor integration failures;
- diagnose technical incidents;
- maintain technical debt/work backlog;
- support internal JS OS and JS Growth systems;
- support client technical work when in scope.

### Inputs
- approved WorkItems;
- repositories;
- architecture/docs/ADRs;
- test/build output;
- integration state;
- deployment policy;
- client scope.

### Outputs
- implementation plan;
- code changes;
- tests;
- PR/review package;
- deployment recommendation;
- incident diagnosis;
- technical documentation.

### Approval boundary
Production deploys, secrets/credential changes, destructive data operations, security-sensitive actions, billing-impacting infrastructure changes, and client production mutations remain controlled actions.

### Success metrics
- successful validated changes;
- defect/regression rate;
- lead time;
- system reliability;
- cost;
- reduction in manual business work;
- auditability.

---

# 6. Finance Department

## Finance / Business Economics Agent

### Mission
Keep growth economically grounded by monitoring revenue, delivery cost, margins, acquisition economics, and cash-impacting decisions.

### Responsibilities
- track MRR and one-time revenue;
- track client delivery hours/direct costs;
- estimate contribution margin using approved methodology;
- monitor pricing/tier economics;
- monitor acquisition cost/time when measurable;
- flag economically broken engagements;
- support revenue forecasts/scenarios;
- surface overdue/missing financial information;
- provide economic context to CEO and Sales/Client Operations.

### Inputs
- contracts/pricing records;
- billing/payment data where authorized;
- delivery time/cost data;
- AI/software/direct costs;
- sales funnel;
- client retention/churn;
- company goals.

### Outputs
- MRR/revenue state;
- client contribution estimates;
- margin alerts;
- capacity/economic recommendations;
- pricing evidence;
- forecast scenarios.

### Approval boundary
The Finance Agent may analyze and recommend. Moving money, issuing refunds, changing subscriptions/pricing, committing spend, filing taxes, or making legal/accounting representations require specifically authorized tools and approvals.

### Success metrics
- accuracy/timeliness of business economics;
- contribution margin;
- CAC/payback insight when measurable;
- detection of scope/economic problems;
- forecast usefulness.

---

# 7. Cross-agent coordination

Agents should not become isolated chatbots.

Use business state and events to coordinate responsibilities.

Examples:

### Prospect becomes positive response
`Sales Agent` receives context → prepares response/audit transition → may request `Prospect Research Agent` to refresh evidence.

### Prospect becomes won client
`Sales Agent` produces handoff → `Client Growth Strategist` establishes onboarding/baseline → specialist agents contribute opportunities.

### Website issue found
`Website Optimization Agent` creates opportunity → `Client Growth Strategist` prioritizes → authorized engineering/website tool prepares change → approval/deployment workflow governs execution.

### Client delivery exceeds economic target
`Finance Agent` surfaces margin issue → `Client Growth Strategist` diagnoses scope → `CEO Agent` may reprioritize/rescope/escalate.

### Sales pipeline stalls
`CEO Agent` identifies revenue constraint → Sales/Prospecting/Research metrics determine whether the issue is market, qualification, contact, message, audit, discovery, offer, pricing, or close.

The system should pass structured business context rather than asking each agent to rediscover the company from scratch.

---

# 8. Responsibility versus tool authority

An agent's responsibility and its execution authority are separate concepts.

Example:

The Sales Agent may be responsible for ensuring a follow-up happens. That does **not** mean it automatically has `send_email` authority.

The Website Optimization Agent may be responsible for a production website improvement. That does **not** mean it automatically has `deploy_production` authority.

The Finance Agent may identify an invoice/refund issue. That does **not** mean it can move money.

Therefore:

**AgentDefinition = reasoning/role permission ceiling**  
**Tool = executable capability**  
**Policy = operating rule**  
**Approval = authorization when required**  
**AgentRun = audit/provenance record**

This distinction is foundational to progressive autonomy.

---

# 9. Initial autonomy posture

The organization should begin with agents primarily operating at:

### Level 0 — Observe
Read approved business state and produce analysis.

### Level 1 — Recommend
Create recommendations/WorkItems for human review.

### Level 2 — Prepare
Prepare drafts, code, audits, proposals, reports, or tool requests without consequential execution.

### Level 3 — Execute with approval
Execute specifically approved tool actions after the approval boundary is satisfied.

### Level 4 — Bounded autonomous execution
Execute explicitly low-risk, policy-approved actions without per-action human approval, with full auditability and rollback/escalation controls.

No department starts at Level 4 merely because the technical capability exists.

---

# 10. Initial implementation priority

This document does **not** change the locked technical roadmap.

When JS OS implementation resumes, continue the current infrastructure sequence before building business agents:

**Phase 3.5 Approval Integration → Phase 3.6 Internal Safe Tools → Phase 3.7 Tools Command Center → Phase 3.8 Integration/Validation → Phase 4 Policies → Phase 5 CEO Reasoning → Phase 6 JS Growth Integration → Phase 7 Sales → later departments**

The responsibility map informs those phases; it does not bypass them.

The first department with enough real manual evidence to justify detailed agent implementation is Revenue/Sales. Client Operations follows once actual client-delivery evidence accumulates.

---

# 11. Validation criteria for creating an agent

Before promoting a responsibility into a durable agent, require evidence that:

- the responsibility recurs;
- its inputs can be identified;
- its output has a clear consumer;
- quality can be evaluated;
- its failure modes are understood enough to establish guardrails;
- required tools can be permissioned;
- consequential actions have approval boundaries;
- it produces enough business value to justify complexity.

If these are not true, keep the responsibility as a human workflow or simple deterministic automation rather than creating an agent.

---

# 12. Current candidate agent set

The working candidate set is:

1. CEO / Business Operator Agent
2. Prospecting Agent
3. Prospect Research Agent
4. Sales Agent
5. Content Agent
6. Local Visibility Agent
7. Client Growth Strategist Agent
8. Website Optimization Agent
9. SEO / Local Growth Agent
10. Client Reporting Agent
11. Engineering Operations Agent
12. Finance / Business Economics Agent

This is deliberately smaller than a conventional company org chart. Add specialized agents only when real operating evidence shows a responsibility deserves separation.

The objective is not to maximize the number of agents.

The objective is to build the smallest auditable agent organization capable of running a profitable growth company.