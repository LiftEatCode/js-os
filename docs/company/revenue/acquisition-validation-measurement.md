# Acquisition Validation Measurement System v1

**Status:** Active experiment specification v1

## Purpose

Define how JS Solutions will evaluate the completed 50-prospect cold-outreach validation sample without relying on anecdotes, vanity metrics, or a simplistic conclusion that “cold email works” or “cold email does not work.”

The experiment is intentionally capped at **50 first-touch qualified prospects** before review. No additional first-touch prospects should be added to this validation cohort merely to create more activity.

The question is not only whether someone buys. The system must identify **where the revenue engine is working or breaking**.

## Experiment funnel

**Qualified prospect → Delivered outreach → Human response → Positive response → Audit accepted → Conversation → Qualified opportunity → Proposal → Won → Revenue → Retention**

Each stage answers a different business question.

## Canonical prospect record

Maintain one canonical record for each of the 50 prospects. At minimum capture:

### Identity and segmentation
- experiment number (1–50);
- business name;
- vertical;
- primary market;
- qualification score/tier where available;
- recipient name;
- recipient role;
- recipient type: direct owner/decision maker, direct employee/manager, general business inbox;
- contact verification source/status.

### Outreach inputs
- first-touch send date/time;
- channel;
- subject line;
- primary opening angle;
- primary evidence type;
- CTA/message variant where materially different;
- whether a prospect-specific mini-audit existed before send;
- approximate research/audit time where available.

### Delivery/response
- delivered/unknown/bounced;
- bounce date/type if known;
- auto-response/OOO;
- human response date;
- response classification;
- sentiment where useful: positive/neutral/negative;
- opt-out/do-not-contact status.

### Funnel outcomes
- audit requested/accepted;
- audit delivered date;
- discovery requested/booked;
- discovery completed;
- qualified after discovery;
- proposal sent;
- proposal amount/offer;
- won/lost/nurture/not-fit;
- loss reason when known;
- recurring MRR won;
- Foundation/one-time revenue won;
- eventual retention/churn when enough time exists.

### Follow-up
- Touch 2 due/sent;
- Touch 3 due/sent;
- reply before follow-up;
- reply after Touch 2;
- reply after Touch 3.

Never overwrite history to make the funnel look cleaner. Preserve stage dates and outcomes.

## Controlled classifications

### Response classification
Use a small stable set:
- POSITIVE_AUDIT_REQUEST;
- POSITIVE_CONVERSATION;
- POSITIVE_OTHER;
- QUESTION_PRICING;
- QUESTION_OTHER;
- NOT_NOW;
- ALREADY_HAS_PROVIDER;
- NOT_INTERESTED;
- WRONG_PERSON;
- OPT_OUT;
- NEGATIVE;
- AUTO_RESPONSE;
- BOUNCE;
- NO_RESPONSE.

Free-form notes may add nuance, but metrics should use stable classifications.

### Opening-angle classification
Examples from the current experiment include:
- REPUTATION_VS_WEBSITE_GAP;
- TRUST_FRICTION;
- SERVICE_ARCHITECTURE;
- OWNER_STORY_UNDERUSED;
- DATA_CONSISTENCY;
- WEBSITE_ERROR_OR_STALE_ELEMENT;
- HIGH_VALUE_SERVICE_VISIBILITY;
- LOCAL_MARKET_POSITIONING;
- OTHER_EVIDENCE_LED.

Do not retroactively force an angle into a category if it does not fit; add a stable category deliberately.

### Loss reason
Use known reasons only:
- PRICE_ECONOMICS;
- INCUMBENT_PROVIDER;
- TRUST_PROOF;
- TIMING;
- NO_URGENCY;
- COMPETITOR_SELECTED;
- INTERNAL_HIRE;
- PROBLEM_NOT_VALUABLE;
- NO_CAPACITY;
- JS_SOLUTIONS_NOT_FIT;
- NO_DECISION;
- UNRESPONSIVE_AFTER_ENGAGEMENT;
- OTHER_KNOWN;
- UNKNOWN.

## Core metrics

### Delivery rate
`delivered / attempted`

Keep bounces separate from no-response.

### Human response rate
`human responses / delivered`

Auto-responses do not count as human responses.

### Positive response rate
`positive human responses / delivered`

A positive response means meaningful willingness to continue, not merely any reply.

### Audit acceptance rate
`audits accepted / delivered`

Also inspect:
`audits accepted / positive responses`

### Conversation rate
`completed or booked qualified conversations / delivered`

Track booked and completed separately when useful.

### Qualified opportunity rate
`qualified post-discovery opportunities / delivered`

### Proposal rate
`proposals / delivered`

Also inspect:
`proposals / qualified conversations`

### Win rate
At multiple denominators:
- `wins / delivered`;
- `wins / qualified conversations`;
- `wins / proposals`.

Each answers a different question.

### Revenue yield
- MRR won per 50 delivered prospects;
- one-time revenue per 50;
- total first-year contracted/realized revenue only when legitimately measurable;
- revenue by vertical/angle/contact type when sample size supports interpretation.

Do not manufacture LTV before retention history exists.

## Diagnostic interpretation

### Problem: low delivery rate / high bounce rate
Likely investigate:
- contact verification quality;
- stale contact data;
- sender/deliverability setup;
- domain/email reputation;
- technical email configuration.

Do not respond by increasing prospect volume.

### Problem: delivered but very low human response
Investigate:
- ICP/fit;
- recipient quality;
- subject/opening relevance;
- specificity of evidence;
- message length/tone;
- channel;
- deliverability/spam placement;
- timing.

Working validation hypothesis from the sales playbook: after roughly 100 genuinely qualified personalized outreaches, **<3% positive response** is a reason to inspect targeting/evidence/message/channel/deliverability/offer before adding volume. The 50-prospect review is an earlier directional checkpoint, not a statistically definitive threshold.

### Problem: responses but few audit acceptances
Investigate:
- CTA clarity;
- whether the evidence sounds useful enough to earn the audit;
- trust/credibility of JS Solutions;
- whether the audit is the correct next step;
- whether responses are curiosity rather than growth intent.

### Problem: audits accepted but few conversations
Investigate:
- audit usefulness;
- strength of business diagnosis;
- CTA after audit;
- whether the audit gives away information without creating a reason for discussion;
- ICP urgency;
- value articulation.

Do not make the audit artificially incomplete to force a call.

### Problem: conversations but few qualified opportunities
Investigate:
- prospect qualification before outreach;
- economics;
- business capacity;
- decision-maker targeting;
- whether the observed digital problem maps to a real business priority.

### Problem: qualified conversations but few proposals
Investigate:
- discovery quality;
- confidence in recommendation;
- offer clarity;
- failure to ask for next step;
- unresolved authority/budget/timing.

### Problem: proposals but few wins
Investigate:
- trust/proof;
- offer-market fit;
- pricing/value relationship;
- proposal clarity;
- sales process;
- competitive alternatives;
- whether price was a surprise.

Working hypothesis: if roughly **20 genuinely qualified conversations produce <10% wins**, inspect offer/trust/proof/pricing/sales/market before scaling.

### Problem: wins but poor retention or excessive delivery cost
This is not an acquisition success.

Investigate:
- fulfillment model;
- expectation setting;
- onboarding;
- measurable value;
- scope;
- pricing;
- client fit;
- delivery economics.

Fix fulfillment/economics before increasing acquisition volume.

## Segmentation analysis

The 50-prospect sample intentionally contains variation. Analyze at least:

### Vertical
Compare response/funnel behavior for:
- auto repair/automotive;
- HVAC;
- plumbing;
- roofing;
- other local-service verticals represented in the cohort.

Do not declare a winning niche from tiny subgroups. Use the data to decide what deserves a larger test.

### Recipient type
Compare:
- verified owner/decision-maker direct email;
- other direct person;
- general business inbox.

Question: **Does verified direct-owner contact materially improve progression?**

### Evidence/opening angle
Compare categories such as:
- reputation-vs-site gap;
- trust friction;
- service architecture;
- visible website error/stale element;
- data inconsistency;
- owner story/differentiation underused.

Question: **Which evidence types cause business owners to engage?**

### Qualification band
Where scores exist, compare Tier A / Tier B-high / Tier B and eventual funnel progression.

Question: **Does the scorecard predict commercial response, or only look sensible on paper?**

### Follow-up touch
Track whether positive responses originate from:
- first touch;
- Touch 2;
- Touch 3.

Question: **How much incremental value does follow-up create?**

## Timing of reviews

### Early operational review
Use before the cohort fully matures only to catch execution failures such as:
- bounces;
- broken sender setup;
- opt-outs;
- obvious systematic message mistake.

Do not rewrite the experiment because the first few prospects are silent.

### 50-prospect cohort review
Review after the approved follow-up sequence has had reasonable time to mature.

Assess:
- delivery;
- responses;
- positive responses;
- audit acceptance;
- conversations;
- early proposals/wins;
- segment differences;
- contact quality;
- message/evidence quality.

This review decides whether to stop, change the model, or design a second controlled validation cohort.

### 100-prospect validation
Only run if the 50-prospect evidence justifies another test. The second cohort should test explicit hypotheses learned from the first 50 rather than simply doubling volume.

## Decision framework after 50

Choose one of these outcomes.

### CONTINUE_SAME_MODEL
Use only if the funnel shows credible positive signal and no obvious structural problem.

A future cohort should still seek refinement, not blind scaling.

### CONTINUE_WITH_TARGETING_CHANGE
Use when certain verticals/qualification profiles/recipient types clearly outperform and there is enough evidence to justify a focused test.

### CONTINUE_WITH_MESSAGE_CHANGE
Use when fit appears credible but the evidence/CTA/message fails to create engagement.

### CONTINUE_WITH_OFFER_OR_SALES_CHANGE
Use when prospects engage and conversations occur but the offer/proposal/close stages fail.

### FIX_DELIVERABILITY_OR_CONTACT_DATA
Use when messages are not reliably reaching verified recipients.

### FIX_FULFILLMENT_BEFORE_SCALE
Use when wins occur but delivery economics/value are weak.

### STOP_OR_RETHINK_CHANNEL
Use when the experiment matures with insufficient commercial signal and reasonable alternative explanations have been tested rather than assumed.

## Experiment integrity rules

- Stop the initial cohort at 50 first-touch prospects.
- Do not add weak prospects to improve sample size.
- Do not relabel negative outcomes as positive engagement.
- Do not count auto-replies as responses.
- Do not count bounces as no-response.
- Do not count an audit request as a qualified sales opportunity.
- Do not count a proposal as revenue.
- Do not count a verbal “sounds good” as won until the commercial acceptance process is satisfied.
- Preserve opt-outs.
- Preserve original message/angle data.
- Record unknown when information is unknown.
- Avoid declaring statistical certainty from small segment samples.

## Revenue-engine view

The experiment should eventually let JS Solutions diagnose the constraint as one of:

**Market/ICP → Prospect quality → Contactability → Message/evidence → Audit → Conversation → Qualification → Offer → Pricing/trust → Close → Fulfillment/retention**

That diagnosis is more valuable than the raw response rate.

## Future JS OS contract

This experiment is training data for the future JS OS revenue system.

Future JS OS should eventually be able to:
- maintain funnel state;
- classify outcomes;
- calculate cohort metrics;
- compare vertical/contact/angle performance;
- surface statistically weak conclusions;
- identify likely funnel constraints;
- recommend the next validation hypothesis;
- estimate acquisition economics once sufficient data exists.

JS OS should not autonomously increase outreach volume merely because a metric is below target. It should diagnose, recommend, and operate within approved acquisition, communication, permission, and policy boundaries.
