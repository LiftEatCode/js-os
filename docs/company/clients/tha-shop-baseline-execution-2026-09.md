# Tha Shop Live Baseline Execution — September 2026

**Status:** Initial external + repository validation pass

## Purpose

Execute the first parts of the Tha Shop Growth Baseline using evidence that can be independently verified without private analytics, Search Console, GBP management access, or owner input.

This is a point-in-time operating record. It distinguishes the public production domain from the newer application repository and does not assume that repository code is currently deployed to the public domain.

---

# 1. Critical discovery — public production and repository are not currently equivalent

The `LiftEatCode/tha-shop` repository declares `https://thashops.com` as its canonical site URL and contains the newer Next.js site architecture.

However, a live external crawl of `thashops.com` on September 4, 2026 returned a materially different website experience consistent with the older site rather than the current repository implementation.

Observed public-site characteristics included:
- older navigation/content structure;
- Store/account/sign-in/order UI;
- GoDaddy-style account/store artifacts including `filler@godaddy.com` in crawled navigation output;
- older Auto Services copy/structure;
- older contact form protected by reCAPTCHA;
- current public address/phone/hours;
- Burnout Bash content present on the homepage.

Therefore:

> **Repository capabilities must not be treated as production capabilities until deployment/domain state is confirmed.**

This materially changes the first baseline assumption.

**Evidence classification:** OBSERVED

---

# 2. Production-domain facts observed

Public crawl currently exposes:
- business name: Tha Shops;
- address: 24495 FM 1488, Magnolia, TX;
- phone: (936) 297-0820;
- Monday–Friday hours: 8:00 AM–6:00 PM;
- Saturday/Sunday closed;
- auto repair, motorcycle repair, restoration/custom-build positioning;
- Burnout Bash October 3–4, 2026;
- contact form;
- directions action;
- testimonials/reviews section on homepage;
- service navigation for auto, motorcycle, fleet, fabrication;
- gallery/event/content navigation.

The newer repository uses the singular brand `Tha Shop` while the public crawl frequently uses `Tha Shops`. Brand/NAP naming consistency should be confirmed intentionally rather than changed automatically.

**Evidence classification:** OBSERVED

---

# 3. Production content observations

The live Auto Services page is broad and includes maintenance, diagnostics, brakes/ABS, suspension/steering, engine/cooling, electrical, transmission/drivetrain, tires, exhaust, heating/AC, and fleet content in one long page.

This strengthens the earlier hypothesis that dedicated high-value service journeys may eventually be useful, but it still does not prove which service pages should be created.

Decision remains dependent on:
- owner service priorities/economics;
- Search Console/query evidence;
- local demand/competitor evidence.

**Evidence classification:** OBSERVED page architecture / optimization opportunity HYPOTHESIS

---

# 4. Production conversion observations

The live public site exposes:
- phone number;
- contact form;
- directions action;
- business hours/location.

The contact page form observed in the external crawl requests name and email and is protected by reCAPTCHA.

The external crawl cannot prove successful form delivery, call attribution, conversion-event tracking, or booked-job outcomes.

**Evidence classification:** OBSERVED paths / outcome UNKNOWN

---

# 5. Analytics state

The newer repository contains explicit event instrumentation for:
- `appointment_started`;
- `appointment_submitted`;
- `phone_click`;
- `directions_click`.

That implementation only activates with a valid `NEXT_PUBLIC_GA_MEASUREMENT_ID` and browser `gtag`.

Because the public domain currently appears to serve a different implementation, those repository events cannot be assumed to be active on `thashops.com` production.

Current classification:

**Repository measurement design:** OBSERVED  
**Public-domain equivalent implementation:** NOT VERIFIED / likely different  
**GA4 data receipt:** UNKNOWN  
**Key-event configuration:** UNKNOWN  
**Historical conversion baseline:** UNKNOWN

---

# 6. SEO/indexability observations

Positive evidence:
- the public homepage, About page, Auto Services page, and Contact page are externally discoverable/crawlable;
- local Magnolia and service terminology appears in public content;
- major service navigation is crawl-visible.

Concerns/opportunities:
- public content is materially different from the current repository, so SEO work done only in the newer codebase may not affect production yet;
- broad service consolidation may limit high-intent journey depth, pending demand evidence;
- public crawl output contains duplicated headings/content patterns on Auto Services;
- public homepage copy repeats keyword phrases heavily enough to warrant a quality/readability review rather than further keyword insertion;
- singular/plural brand naming (`Tha Shop` vs `Tha Shops`) should be intentionally standardized when facts are confirmed.

No claim is made here about rankings, organic growth, index coverage, or Search Console health.

---

# 7. Updated priority board

## P0 — Deployment/domain-state confirmation

### THA-011 — Determine which site is intended to be production

**Category:** TECHNICAL / BUSINESS CONTEXT  
**Evidence:** public `thashops.com` and current repository are materially different  
**Impact:** CRITICAL  
**Confidence:** HIGH  
**Effort:** LOW initially  
**Risk:** HIGH if wrong site is modified/deployed without confirmation  
**Priority:** **P0**

Required decision:
- Is the existing public site intentionally still production while the Next.js site is staged?
- Is the Next.js repository intended to replace it but has not yet been connected to the domain?
- Is there another deployment URL/environment for the new site?

Until resolved:
- do not describe repository analytics as live;
- do not assume repository SEO changes affect production;
- do not perform an unapproved production cutover;
- do not delete/overwrite the existing public site.

This is a decision/confirmation P0, not authorization to deploy.

---

## P1 — After deployment state is known

1. Confirm current owner business/service priorities.
2. Validate analytics on the **actual production implementation**.
3. Establish Search Console baseline for the production property.
4. Establish GBP/local/reputation baseline.
5. Validate live phone/contact/directions/customer journeys.
6. Establish qualified-lead feedback loop.
7. Reconcile brand/business facts across production, repository, GBP, citations, and social profiles.
8. Use business + search evidence to choose high-value service journeys.

---

# 8. Deployment readiness questions

Before any domain cutover to the newer repository, validate:
- production hosting target;
- DNS/domain ownership/access;
- environment variables;
- analytics measurement ID;
- appointment email/delivery configuration;
- form abuse controls;
- all primary routes;
- redirects from old URLs;
- sitemap/robots/canonical behavior;
- LocalBusiness/business facts;
- phone/directions links;
- mobile navigation;
- event content;
- inventory/for-sale state;
- privacy/terms requirements;
- legacy Store/account behavior and whether it is intentionally being retired;
- old-page URL inventory so useful indexed URLs are not accidentally lost.

A migration/cutover should be treated as a controlled conversion + SEO change, not simply a Vercel deploy.

---

# 9. Immediate information needed from Josh / owner

Only a small number of facts are now blocking the next high-value steps:

1. Is the Next.js `LiftEatCode/tha-shop` site intended to replace the current public GoDaddy-style site?
2. If yes, has it already been deployed to a staging/Vercel URL?
3. Which three service/job categories does Tha Shop most want more of right now?
4. Is Burnout Bash primarily a community/brand event or expected to generate direct shop business?
5. Does JS Solutions currently have access to GA4, Search Console, and the Tha Shop Google Business Profile?

Do not expand this into a large questionnaire yet.

---

# 10. What was accomplished in this execution pass

Completed without private access:
- compared public production evidence with repository architecture;
- identified a production/repository mismatch;
- verified core public business/contact facts exposed by the website;
- reviewed public Auto Services architecture;
- reviewed public conversion paths;
- confirmed repository analytics event design;
- established that repository analytics cannot currently be assumed live;
- identified externally crawlable pages;
- promoted deployment/domain-state confirmation to P0;
- defined migration readiness checks if the newer site is intended for production.

Blocked by private/owner context:
- GA4 data validation;
- Search Console baseline;
- GBP performance baseline;
- lead quality/booked-job data;
- current service economics/capacity;
- deployment intent/staging state.

---

# Core conclusion

The first live baseline pass found something more important than another SEO tweak:

> **The public `thashops.com` experience and the current Next.js repository are not the same system.**

Before measuring, optimizing, or migrating at scale, JS Solutions must establish which implementation is authoritative and which is intended to become production.

This is exactly why the Local Growth System begins with baseline validation rather than immediately producing more work.