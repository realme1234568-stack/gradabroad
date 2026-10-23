# GradAbroad launch review — 22–23 October 2026

Scope requested: live end-to-end planning journey, complete live catalogue presentation/counts, then privacy/support/deletion readiness. Changes remain local for owner review; no commit, push, production deployment, paid-plan change or real account deletion was performed.

## Production checks

| Check | Result / evidence |
| --- | --- |
| Document isolation and live sign-in | **Owner-reported pass**, 22 October. The owner said they tested launch items 1 and 2. This review does not convert that report into an independent agent security audit. |
| Programme pagination | Walked all five pages of each degree list in the live browser. Counts: 24 + 24 + 24 + 24 + 4 = **100 distinct bachelor’s and 100 distinct master’s**. Next disabled on the last page. |
| Search and admission filters | “Rhine” returned three bachelor’s programmes; adding Open admission returned one. A nonsense search produced the correct empty state; Clear filters restored the full list. |
| All detail pages | Public HTTP/rendered-HTML checks passed **200/200**, with no authentication: status 200, expected programme/university, English/public labels, requirements, intake/deadline and cost sections, DAAD/university source links and preliminary-information disclaimer. Full result: `data/launch-catalogue-check-2026-10-22.json`. This is not a fresh factual review of all university rules or an HTTP check of every external university link. |
| Sample detailed pages | Browser inspection of Rhine-Waal Agribusiness BA and Aalen Machine Learning/Data Analytics master’s pages. Requirements, dates, fees, review date, source links, missing-data labels and research disclaimer were present. Master’s detail and catalogue fit the phone viewport. |
| Save programme and cross-screen status | Added the previously unsaved Aalen programme, changed it to Interview, reloaded the tracker and confirmed the status. The dashboard showed Interview and My Shortlist classified it under master’s. |
| Checklist | Toggled the Aalen GMAT cell, saved, fully reloaded and confirmed it remained checked. Restored it to unchecked and saved. Internal mobile navigation with an unsaved change displayed the expected warning; Cancel stayed on the tracker. Saving then allowed navigation. |
| Shortlist removal | Removed the temporary Aalen shortlist entry; full reload confirmed absence. Existing five saved applications were retained. |
| Profile persistence | Saved a temporary preferred-subject value, reloaded to confirm the resume view displayed it, then restored the original value and saved. A fresh desktop view confirmed the test value was absent. |
| INR/EUR calculators | Saved amounts with an extra 0.25 in each calculator; totals and category breakdowns retained decimals. Saved independent 350000.50 INR and 1000.50 EUR targets. Full reload confirmed both edited totals and targets. INR empty edited amount was rejected with a validation message. Restored both original amounts and empty targets; fresh desktop view confirmed restoration. |
| My Journey | A locked later stage explained why it could not advance. Confirmed Passport, observed the next stage unlock, reloaded and verified progress persisted. Reopened Passport and confirmed the original zero-progress state returned. |
| Notifications | The notification centre contained the three expected Aalen addition/status/removal messages, including after the next-day session continued. These ordinary test activity entries remain in the account history; other notifications were not deleted or marked read. |
| Responsive layouts | Phone checks measured 390px viewport and page width for catalogue, tracker, profile, calculators, sample detail and journey. Tracker table scrolls inside its own region. Desktop profile/journey fit the page; at a 1470px desktop viewport the calculator cards both measured **536 × 1763px**. This is Chrome responsive testing, not physical-device or Safari/Firefox testing. |
| Session continuity | Reloads, navigation and the next-day continuation retained the signed-in session. A separate logout/Google-login cycle was not repeated by the agent; the owner reported that flow tested. |

No functional planning-data failure was reproduced in these checks. They do not establish zero defects, uninterrupted provider availability or complete cross-browser coverage.

## Local improvements

- Contact Us now has explicit support, privacy/data-request, account-deletion and security-report routes to the official mailbox, with prefilled email subjects and no automatic disclosure/deletion.
- It explains sign-in-email verification, downloading files before deletion, and avoiding sensitive attachments.
- Settings has a visible privacy/account-help section linking to Contact, Privacy and Terms.
- The general feedback field has an accessible label, a warning against sending private material, and a link to the appropriate account/privacy request channel.
- `docs/PRIVACY_SUPPORT_OPERATIONS.md` records the verified infrastructure facts and a scoped manual support/export/deletion/incident procedure. No new privileged public endpoint was introduced and no existing accepted policy version was rewritten.

## Remaining operational/legal decisions

1. **Backups and restore rehearsal:** Supabase’s actual Free-plan Backups page explicitly excludes project backups. Establish encrypted off-site database and file backups plus a tested restore procedure, or choose a suitable plan. Database backups alone do not include Storage object bytes. No paid upgrade, private-data export to a new provider or recurring automation was performed.
2. **Operator identity:** the owner confirmed “GradAbroad, New Delhi, India” and receiving mail at `gradabroad.online@gmail.com`, but did not identify the legal individual/entity or a full publishable address. Do not invent these details or call the policies legally final. Applicable-law, age and transfer review remains for a qualified adviser.
3. **Support operations:** adopt the daily inbox and retention procedure; rehearse a verified export/deletion request with a designated disposable account. No real account was deleted as a test. Provider-specific retention/transfer details remain partly unconfirmed.
4. **Brand release:** the prepared website logo assets/source changes are still local. Google branding verification is a separate pending workflow; this launch review did not retry it.

These are separate from the planning journeys that passed. A small beta and a broad commercial launch have different operational needs; passing the UI checks does not complete the remaining decisions above.

## Validation

180 automated tests passed; lint, TypeScript/production build and whitespace checks passed. Build/local public-page QA used a public-data-only fixture and dummy Supabase configuration, without real credentials. Production planning persistence was checked separately through the authenticated live browser as described above. Updated Contact and Settings still require post-deployment confirmation when released.

## Website release approval — 23 October

The owner subsequently authorised committing and pushing the prepared website changes to main and will check the Vercel deployment personally. The initial local-only statements above record the earlier review state. Google branding verification remains unconfirmed. The R2 backup experiment was retired at the owner’s request under a zero-spending constraint; this website release does not activate backups, export private data or enable a paid service. A verified database/file backup and recovery procedure remains outstanding.
