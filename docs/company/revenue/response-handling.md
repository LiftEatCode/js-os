# Prospect Response Handling Playbook v1

Status: **Testable operating playbook v1**

## Purpose

Convert responses from qualified cold outreach into the next appropriate sales action without rushing to pitch, improvising under pressure, or treating every reply as a sales opportunity.

The governing principle is:

**Response → Interpret intent → Preserve trust → Advance one appropriate step → Record outcome**

The goal of the first reply is normally not to close a $1,500/month engagement. It is to earn the next useful step while continuing to qualify whether JS Solutions can create enough value to justify an engagement.

## Response classification

Every inbound response should be classified before replying.

| Response | Primary objective | Next state |
| --- | --- | --- |
| Yes / send it | Deliver promised audit and test growth intent | AUDIT_DELIVERED |
| Interested / tell me more | Clarify interest, deliver evidence, move toward conversation | ENGAGED |
| Call me / let's talk | Schedule or conduct discovery | DISCOVERY |
| What does it cost? | Give transparent starting point without prescribing blindly | PRICING_DISCUSSION |
| Already have someone | Determine whether there is a real unresolved problem without attacking incumbent | NURTURE or CLOSED |
| Not interested | Respect response and close | CLOSED_NOT_INTERESTED |
| Not now / later | Identify legitimate timing if offered; otherwise close gracefully | NURTURE |
| Remove me / unsubscribe | Confirm and suppress future outreach | DO_NOT_CONTACT |
| Wrong person | Ask only for appropriate routing if natural and non-pushy | ROUTING |
| Negative / hostile | Do not argue; acknowledge and close | CLOSED_NEGATIVE |
| Auto-response / OOO | Record return date if supplied; do not count as human response | WAITING |
| Bounce | Mark contact invalid; do not guess replacement email | CONTACT_INVALID |
| No response | Follow approved follow-up cadence | WAITING_FOLLOWUP |

## 1. Yes — send the audit

### Objective
Deliver exactly what was promised, demonstrate useful thinking, and discover whether the business is actively trying to improve customer acquisition.

### Response pattern

> Absolutely — I attached/sent the short review I mentioned. I kept it focused on the few opportunities I think are most worth looking at rather than giving you a giant generic SEO report.
>
> The main thing I noticed was **[highest-confidence finding]**. There are a couple of related opportunities in the review as well.
>
> If these are worth improving, is generating more of the right local customer demand something you're actively working on right now?
>
> — Josh
> JS Solutions

### Rules
- Send the prospect-specific audit already created from public evidence.
- Reverify time-sensitive facts before delivery if material time has passed.
- Do not attach a proposal.
- Do not introduce pricing unless asked.
- Do not turn the audit into fear-based criticism.
- Ask one useful qualification question.

## 2. Interested / tell me more

### Objective
Move from general curiosity to a concrete business problem.

### Response pattern

> Sure. I help local service businesses find and fix the highest-impact gaps between their reputation/capabilities and what potential customers actually see when they find them online.
>
> For **[Business]**, the first thing that caught my attention was **[specific evidence-backed observation]**. I put together a short review showing that and a few related opportunities.
>
> I'll send that over first. If it lines up with something you're trying to improve, we can talk through what would actually be worth fixing.

Avoid a feature dump about SEO, websites, AI, automation, social media, etc.

## 3. Call me / let's talk

### Objective
Move directly to discovery without making the call a generic sales pitch.

Before the call, review:
- qualification score;
- research record;
- audit;
- likely highest-value services;
- known capacity/buying signals;
- unresolved assumptions.

Use `discovery-call.md` as the operating guide.

If scheduling by email:

> Happy to. I'd like to understand what you're trying to grow first, then I can walk you through what I found and whether I think it's worth doing anything about.
>
> **[offer practical scheduling options or scheduling path]**

## 4. What does it cost?

### Objective
Answer directly without prescribing a recurring engagement from a public audit alone.

Approved response:

> Our ongoing Local Growth System currently starts at **$1,500/month**, but I wouldn't recommend that just from a public website review.
>
> I'd first want to understand which services you want to grow, current capacity, what is already working, and whether there is enough opportunity to justify the investment. The short review I offered is free.

If significant foundational work is clearly required, do not quote a Foundation project until scope is understood. Current working range is $1,500–$3,500 one time.

## 5. We already have someone

### Objective
Respect the existing relationship and determine whether a meaningful gap still exists.

> Makes sense — I'm not looking to create a problem where there isn't one.
>
> The reason I reached out was specifically **[observation]**. If that's already being addressed, you're probably covered. If it isn't, I'm happy to send the short review so you can use it internally or with the team you already have.

Do not disparage another agency, freelancer, employee, or vendor.

## 6. Not interested

> Understood. Thanks for letting me know — I won't keep chasing you about it.
>
> — Josh

Record the outcome. Do not continue the sequence.

## 7. Not now / later

If the prospect supplies a real timing event (season, project, budget cycle, ownership transition), record it and ask permission for a specific future follow-up.

If no real timing signal exists:

> No problem. I'll close the loop on my side. If it becomes useful later, you're welcome to reach out.

Do not manufacture a nurture sequence from a polite rejection.

## 8. Remove me / unsubscribe

> Absolutely — I've marked it so you won't receive further outreach from me.

Immediately suppress future prospecting outreach to that contact/business as appropriate. No sales copy in the confirmation.

## 9. Wrong person

> Thanks for letting me know. Is there someone who handles the website/local customer acquisition side that would be more appropriate, or should I close this out?

Only use a referral they voluntarily provide. Never infer or generate a coworker's email from a naming pattern.

## 10. Negative / hostile response

Do not defend the outreach, debate the prospect, or attempt a clever comeback.

> Understood. I won't follow up further.

Record and close.

## 11. Auto-response / out of office

- Do not count it as a positive, negative, or human response.
- Record the return date if explicitly provided.
- Do not send additional messages during the stated absence unless operationally necessary.
- Resume only within the approved sequence and reasonable timing.

## 12. Bounce

- Mark the address invalid.
- Do not guess another address.
- A replacement contact must independently pass the same verification standard as the original contact.
- Keep the business in the experiment but distinguish `BOUNCE` from `NO_RESPONSE`.

## 13. No response

No response is not rejection.

Follow the existing outreach sequence:
- Touch 2: normally 2–3 business days later using a second useful observation or competitor gap.
- Touch 3: normally 4–7 business days after Touch 2 and close the loop.
- Avoid holiday/weekend timing that makes the experiment noisier.
- Stop after the defined sequence unless the prospect creates a new reason to engage.

Touch 2 must add information. Do not send a message whose substance is only “following up.”

Touch 3 should make it easy to ignore/close without pressure.

## Audit-delivery decision

Before sending an audit after a positive reply, confirm:

1. Is the recipient the intended/appropriate person?
2. Are the material findings still true?
3. Is every factual claim supported by public evidence?
4. Are inference and fact clearly distinguished?
5. Are there only 3–5 meaningful priorities rather than a laundry list?
6. Does each priority connect evidence to a plausible business consequence and recommended action?
7. Is there any claim about rankings, traffic, leads, revenue, or competitors that we cannot substantiate? Remove it.
8. Is the CTA one logical next step rather than an immediate retainer pitch?

## Qualification after engagement

A reply is a signal, not proof of fit.

As engagement progresses, continue testing:
- Is growth actually desired?
- Which services/customers matter economically?
- Can the business handle additional demand?
- Is there an identifiable customer-acquisition problem JS Solutions can influence?
- Is the decision maker involved?
- Is the potential value large enough to justify the engagement?
- Can JS Solutions deliver within its margin/capacity constraints?

A positive reply can still end in `NOT_FIT`.

## Response metrics

For the 50-prospect validation experiment, record at minimum:
- prospect/business;
- vertical;
- original recipient and recipient type (owner/direct/general);
- first-touch date;
- response date;
- response classification;
- sentiment (positive/neutral/negative where useful);
- audit requested/accepted;
- discovery conversation booked/completed;
- proposal sent;
- won/lost/nurture;
- loss reason if known;
- eventual MRR/setup revenue;
- time spent after response.

Do not optimize the outreach system from isolated anecdotes. Use the full sample and funnel stages to identify where conversion is breaking.

## Operating principle for JS OS

This manual playbook is intended to become evidence for the future Sales Department behavior in JS OS.

Future automation should classify and recommend before acting. Consequential external communication remains governed by tool permissions, approval policy, evidence requirements, contact verification, opt-out state, and auditability.
