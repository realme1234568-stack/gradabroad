## Expanded student profile — October 19, 2026 (local review)

My Profile now has seven sections: personal/contact details, address, Class 12 education, university education, language/aptitude tests, experience/achievements, and study plans. Includes contact email, date of birth with derived age, international postal codes, percentage/GPA scores with original scales, test dates/scores, skills, links, intake and funding preferences. Fields are optional. Contact email does not change authentication email. Age is calculated rather than stored.

First-time users complete the form and save to switch to a resume-style profile. Existing saved profiles open in profile view, including legacy six-field records. Edit profile at top right opens all fields; Cancel restores the saved baseline. Failed saves retain drafts. Unsaved edits warn on refresh and ordinary link navigation. Account changes clear loaded values and reset the editor. The existing owner-only account_data profile object stores the additional fields, so no Supabase migration is needed.

Validation: lint, 96 tests and production build passed. Tests cover new save/view/edit/cancel behavior, legacy records, persistence/reload, failed saves, date/age boundaries, grade scales, safe links and email format. Desktop and phone browser review used a temporary sample-only route with the actual profile component; the route was removed. Both saved/editor layouts fit the phone viewport and age updates were observed. Live signed-in Supabase save/reload was not repeated. Changes remain local, uncommitted and unpushed.

## Tracker background consistency — October 19, 2026

Removed the leftover surface background from the tracker title and conflicting table-row backgrounds. The horizontal scroll viewport now owns the panel surface, border and clipping, while an intrinsic-width inner container covers the entire table. Document-label cells retain native table-cell layout instead of flex, preventing broken row geometry. Checklist/table panels share the same surface; checked controls keep their mint state. The legacy application-tracker URL reuses the same component. No data or authentication behavior changed.

Validation: lint, 90 tests, production build and diff checks passed. Populated visual verification in a local signed-in browser remains pending. Vercel deployment remains separate from these local checks. No Supabase update is required.

## Calculator improvements — October 19, 2026

Both calculators now share one component and equal-width/equal-height cards, matching summary panels, scrollable expense lists, and aligned controls. Added separate INR/EUR budget targets, remaining/over-budget balances, editable expense categories, category filtering, and category spending breakdowns. Existing expense arrays remain compatible; older entries receive an inferred category until explicitly edited. Totals and breakdowns include all expenses even when the list is filtered. Targets require Save target; expense add/edit actions continue saving independently. The INR preparation plan and EUR monthly plan remain separate and are not converted or combined.

`supabase/migrations/20261019090000_calculator_budgets.sql` was applied on October 19, 2026 to the production GradAbroad Supabase project (`fshixuzamlsmhsrckzzk`) through the SQL editor, in a transaction. It extends account_data constraints to permit private budget-inr and budget-eur rows. Owner-only RLS remains in effect. Preflight inspection found extra authenticated TRUNCATE/REFERENCES/TRIGGER permissions; those unused permissions were revoked, retaining SELECT/INSERT/UPDATE/DELETE. The committed migration and fresh schema reflect this hardening. Do not rerun the migration on that project. Do not rerun schema.sql on the existing database. Categories fit within the existing expense JSON arrays and need no separate migration.

Validation: 90 tests pass, including target save/reload, currency separation, decimal balances, zero/cleared budgets, save failure/retry, filtered editing, and removal protection during editing. Local Chrome measured both desktop cards at identical dimensions; phone layout had no horizontal overflow, and category filtering was checked. Browser review used a temporary development-only route with signed-out placeholder configuration; that route was removed. Post-migration database verification passed all seven checks: valid INR/EUR budget objects and legacy profile/expense shapes accepted, invalid budget arrays rejected, RLS enabled, anonymous SELECT/INSERT blocked, authenticated TRUNCATE blocked, and owner read/write policy intact. Shape tests used a temporary table copied from the live constraints and rolled back; no customer records were changed. Live signed-in browser save/reload and two-account UI testing remain separate from these database checks. Vercel deployment and live database verification remain separate from the local checks.

## Shared page theme — October 19, 2026

Applied the homepage charcoal/mint design system to the catalogue, dashboard, shortlist, tracker (including its legacy alias), profile, expense calculators, settings, authentication screens, notification center, account menu, and not-found screen. Shared semantic color tokens support both the default dark theme and the existing light preference. Replaced multicolor gradients and feedback celebration effects with restrained surfaces and consistent controls; data operations, authentication checks, and database policies are unchanged. Includes the global hand cursor and scroll-linked workspace zoom/fade updates.

Validation: lint, 86 existing tests, and production build passed during implementation. Local browser review covered catalogue, profile, settings, light/dark switching, sign-in, and notifications. Dashboard and expense layouts were inspected through a temporary development-only rendering route with placeholder Supabase configuration and no signed-in user; that route was removed. Phone expense layout had no horizontal overflow. Populated tracker/shortlist and live signed-in persistence were not exercised in this visual review. The visual theme itself needs no Supabase migration; the calculator budget migration is described above.

## Homepage redesign — October 18, 2026

Rebuilt the public landing page with a dark charcoal/mint visual system and Germany-first messaging. Includes a lightweight animated SVG journey illustration, scroll entrances, interactive sample shortlist/checklist/budget tabs, native FAQ disclosures, and responsive layouts. Motion can be paused and respects reduced-motion preferences. The header adopts the homepage palette while preserving its existing navigation, account, and notification controls.

Removed stock-photo testimonials and placeholder social links. Examples are explicitly labeled; the FAQ accurately states that applications are submitted through universities, document uploads are unavailable, and notifications are in-app. No database changes or new dependencies are needed.

Validation: lint, all 86 existing tests, and the production build passed (build used placeholder Supabase public values). Local Chrome checks covered desktop and narrow phone layouts (effective CSS widths 433px and 355px with the browser's current zoom), no horizontal overflow, mobile navigation, preview tabs, checklist progress, motion pause, FAQ expansion, and an empty browser error log. Live authentication/database workflows were not retested for this presentation-only change. Vercel deployment and live-site verification remain separate from these local checks.

# Deploying the readiness fixes

## October 16: notification center and misleading controls

- Successful shortlist additions/removals and application-status changes display a queued popup for three seconds each. The persistent root provider keeps popups alive across internal page navigation. After each popup, the bell refreshes its unread count. Notifications are accessible from the header bell, Settings dropdown, and Settings page.
- History shows the latest 100 records with timestamps and mark-as-read. Load/save failures show a retryable error. Account changes clear popups/history; requests are filtered by account and protected by database RLS.
- Apply `supabase/migrations/20261016190000_notifications.sql` before deploying this version. It creates the notification table, owner-only select/update policies, and a transactional shortlist trigger. Clients may select their own records and update only read_at; they cannot insert, delete, or change messages/ownership. No historical notifications are backfilled.
- The migration was applied on October 16, 2026 to the production GradAbroad Supabase project (`fshixuzamlsmhsrckzzk`) through the SQL editor in a transaction, after confirming the table and function did not already exist. Live catalog checks confirmed the enabled trigger, RLS, anonymous-read denial, client-insert/message-edit denial, read_at update permission, and owner-only read/update policies. Do not rerun this migration on that project. Its triggers and security rules were exercised in isolated PGlite/Postgres with two simulated authenticated accounts and an anonymous role: insertion/status/removal notifications, no-op and rollback behavior, own read-state updates, cross-account denial, tamper/insert/delete denial, and auth-account cascade cleanup passed. This is not a substitute for preview integration checks against Supabase.
- Before deploying the website code: preview the code, test all three actions from every relevant screen, verify three-second popup queues, refresh and open the bell, mark as read, and check isolation with two real test accounts. Confirm notification access from the settings menu and page at mobile widths.
- Removed the disabled upload form and replaced it with an honest document-checklist link. Homepage/settings no longer promise file management or email reminders; the testimonial mentioning reminders was removed rather than rewritten. Uploads remain unavailable. No file buckets, file permissions, or existing documents were changed.
- These source changes remain local until explicitly committed/pushed. Live provider and browser testing remain pending.


## October 16: checklist indicators, unified tracker, and sign-in guidance

- Checklist dirty state is now set by actual checkbox changes and document add/remove actions. Application-status changes and typing an unsubmitted document name do not enable Save checklist or trigger checklist navigation warnings.
- `/application-tracker` renders the same tracker as `/dashboard/my-tracker`, using `shortlists` and `tracker_preferences`. The old `application_tracker` table is left untouched; its separate rows are no longer displayed by this route. No records are deleted or migrated.
- Signed-out protected-page visits show the sign-in controls with an explanation and retain a validated destination through OAuth/email login. Legacy callback links without a destination still return home. Only known local routes are accepted as return destinations.
- Signed-out shortlist attempts explain that sign-in is required and offer a Sign in to shortlist action returning to the catalogue after authentication. The user still chooses the program after login; no automatic shortlist insertion is performed.
- No database migration is needed. Live provider redirect configuration and signed-in browser flows still require verification on a preview deployment.


## October 14: loading errors and checklist navigation protection

- Dashboard, My Shortlist, and the older Application Tracker distinguish database/network failures from successful empty results and offer Retry. My Tracker also has a retry control for its existing load-error state.
- Unsaved checklist changes prompt before ordinary link navigation. Cancel keeps the page and edits intact. Account-keyed browser-memory drafts restore edits after internal navigation, including Back/Forward or programmatic navigation, until successfully saved. This also preserves unsubmitted custom-document text during internal navigation.
- Refresh/closing retains the existing browser warning. Drafts are not database saves and do not survive a full reload if the user chooses to leave despite that warning. Continue to use Save checklist for persistence.
- Regression tests cover query errors, thrown network errors, retries, cancelled link navigation, draft restoration, successful-save cleanup, and account isolation. No Supabase migration is required. Live browser navigation testing remains pending.


## October 14: status consistency and shortlist removal

- Catalogue, dashboard, and tracker status selectors share Shortlisted, Applied, Interview, Accepted, and Rejected options. Legacy Admit values display as Accepted. Unknown saved statuses remain visible instead of leaving a mismatched selection. New selections save the shared labels. No database migration is needed.
- My Shortlist removes an entry only after the delete response returns its ID. Database errors, network exceptions, and zero-row responses retain the entry and show a retry message. Removal controls are disabled during the request to prevent duplicate submissions.
- Regression tests cover legacy/current/unknown status values across all three editable screens, canonical status writes, deletion failures and retries, duplicate-click protection, and confirmed removal across remounts. These tests use mocked Supabase responses; live website verification remains pending.

## October 14: profile, expenses, and mobile fixes

- My Profile now loads and saves all six existing fields to a private account record. “Saved!” appears only after a successful database response. Failed saves retain edits; failed loads disable editing to prevent overwriting existing data.
- Both expense calculators load and persist separate account records. Add/edit (and the existing EUR remove action) save immediately. Amounts accept zero and up to two decimals, reject blank/negative/invalid values, and totals are calculated in cents. Failed saves retain the form for retry.
- The header has a mobile navigation menu, with outside-click/Escape dismissal and focus restoration on Escape. Account controls remain reachable. The tracker stacks its checklist above a separately scrollable table on smaller screens; expense forms stack their inputs on phones.

### Rollout for these changes

1. Apply only `supabase/migrations/20261014190000_profile_and_expenses.sql` to the Supabase project that will serve the updated app. It creates `account_data` with owner-only row-level security. Do not rerun the complete schema on an existing database.
2. Deploy a preview. Sign in, change each profile field, save, and reload. Add/edit decimal expenses in both calculators, navigate away and return; test removing a custom EUR expense.
3. Verify with two test accounts that profiles and expenses are isolated. Check network failures produce an error rather than a false success.
4. Test navigation, account controls, expense input, and tracker scrolling at phone widths (320px and 390px), then test desktop layout.
5. Deploy to production after those checks pass.

Local tests cover persistence across remounts, failures/retry, account-change save protection, separate calculator records, decimal totals, invalid edits, removal, and menu interaction. These use mocked Supabase responses; they do not verify the deployed database or real browser geometry. Compilation uses placeholder public Supabase values. The migration was applied on October 14, 2026 to the production GradAbroad Supabase project (`fshixuzamlsmhsrckzzk`) through the SQL editor in a transaction. A preflight check confirmed the table did not already exist. Database verification confirmed row-level security enabled, anonymous SELECT blocked, and both read and write policies matching auth.uid() to user_id. This verifies the database configuration; live two-account application testing remains pending. At the time of database verification, the website changes had not yet been pushed or deployed. Deployment and live application checks remain separate from this database verification. Do not rerun this migration on that project.

Previously entered values that disappeared under the old implementation cannot be recovered. Profile edits require Save Changes; calculator changes require their add/edit confirmation. Concurrent tabs use last-save-wins behavior.

## Earlier readiness fixes

This branch contains the cleanup and readiness fixes. The database migration must be applied before the updated application is used against the existing Supabase project.

## Required order

1. Apply `supabase/migrations/20261009190000_persist_checklists_and_notes.sql` to the Supabase project used by the preview. This is an additive migration: it adds the missing shortlist note/program-level columns if necessary and a private per-user checklist table. Do not rerun the entire schema.sql on an existing database.
2. Deploy this source to a preview branch.
3. Sign in, confirm existing programs show Already Shortlisted, edit a note/status/deadline, and refresh to verify persistence.
4. On My Tracker, check a document, add a custom document, click Save checklist, and refresh. Verify that the changes remain. Changes to application statuses save separately.
5. Verify with two test accounts that one account cannot read or change another account's checklist. The migration enables row-level security and requires auth.uid() to match user_id.
6. Promote only after those integration checks pass.

Checklist changes are explicitly saved with Save checklist. Save failures preserve edits for retry. A browser refresh/close warning protects unsaved changes, and the October 14 navigation protection above now preserves drafts during internal app navigation. Concurrent tabs use last-save-wins behavior.

## Validation completed locally

- ESLint: zero errors and warnings.
- TypeScript: passed.
- Production build: passed with placeholder public Supabase variables; this checks compilation and prerendering, not live database connectivity.
- Five component regression tests passed: checklist persistence across remount, save failure/retry, failed-load protection, account-change save protection, and catalogue recognition/metadata updates.
- Tests use a mocked Supabase service. The SQL migration and live database isolation have not been executed or verified in these tests.

Existing unrelated limitations, including disabled GitHub authentication and document uploads, remain.

## October 20: My Journey

- Added `/dashboard/my-journey` and a dashboard entry. Seventeen circular milestones cover passport, eligibility, shortlist, language tests, aptitude tests, dMAT, APS, application documents, applications, admission, funding, insurance, visa, housing, enrolment planning, flight tickets, and departure checks; a final airplane lights up when the route is resolved.
- The current milestone opens a confirmation before it is completed. Only a successful account save unlocks the next stage and sends a light beam along the dotted connector. Future stages remain muted and can be opened for information, but cannot be completed early. Tooltips work on hover and keyboard focus; tapping opens details on phones.
- Applicable test/APS/funding/visa steps can be marked not applicable. Reopening a resolved milestone requires a second confirmation and clears that milestone and later progress. This changes only journey progress, not application statuses, checklists, profile details, or expense records.
- Progress is stored as a versioned ordered prefix in the account's independent `account_data` journey row. Invalid stored progress and failed loads block writes; failed saves do not claim completion. Existing account-change protection prevents copying one account's progress to another.
- Added horizontal swipe/keyboard scrolling, arrow controls, automatic centering of the next stage, a jump-to-current control, a native keyboard-accessible confirmation dialog, a motion pause control, and reduced-motion support. Phone-width inspection confirmed the page width matches the viewport while only the journey track scrolls horizontally.
- Guidance is a planning sequence, not a claim that all procedures happen in this order. Conditional requirements are identified; enrolment timing follows the university's admission instructions. Included an informational after-arrival checklist. dMAT is separate from GMAT/GRE and does not replace APS.
- Primary sources checked October 20: [APS dMAT](https://aps-india.de/dmat/), [APS checklists](https://aps-india.de/checklists/), and [official German study-visa guidance](https://www.make-it-in-germany.com/en/visa-residence/types/studying). No fixed visa funding amount or universal test requirement is embedded.
- Applied `supabase/migrations/20261020090000_journey_progress.sql` to the GradAbroad Supabase project. This extends the allowed account-data kinds and object shapes to include journey progress. Existing owner-only RLS and grants remain unchanged. Verified all six record kinds using a temporary constraint-copy table in a rolled-back transaction; confirmed RLS is enabled, anonymous reads/writes are denied, and the authenticated owner policy applies to reads and writes. No production user records were changed by verification.
- Automated checks cover confirmation, future-step locking, conditional skips, reopening, save/load errors, corrupt progress, account changes, reload persistence, the final airplane, and Escape/motion controls. Browser checks used a temporary local sample-progress preview, which was removed afterward; a real signed-in deployment test remains pending. Changes are local and have not been committed or pushed.
- Final local validation: 105 tests passed across 9 files; lint and the production build passed. The new protected route redirects signed-out requests to sign-in while retaining `/dashboard/my-journey` as the return destination. Independently checked authenticated SELECT, INSERT, UPDATE, and DELETE privileges; each is available under the existing owner policy.

## October 20: owner workspace

- Added a protected `/admin` workspace and an owner-only Settings menu link. Server-side verified authentication and a strict database role check protect the page. Each privileged database function independently checks the current account's private owner record, email verification, account activity, and ban status. Client metadata, profile contact emails, and local UI flags cannot grant ownership.
- Owner tools include platform totals, catalogue search/pagination, adding/editing courses, publishing/unpublishing, exporting the complete catalogue across pages, optimistic revision checks, and an activity history. New entries begin unpublished. Unpublishing preserves existing student applications and all personal planning records.
- No paid tiers or per-account feature quotas exist in the current application. Existing planning tools remain available without a subscription restriction. Input validation, pagination, authentication, and database privacy protections remain enforced.
- The owner role does not bypass users' existing personal-data policies. Dashboard counts aggregate accounts, programmes, shortlists, and journeys; private profiles, expenses, checklists, and journey contents are not exposed. Audit records and owner-role rows are stored in a non-exposed private schema, with no client table or sequence grants.
- Applied `supabase/migrations/20261020130000_application_owner.sql` to the production GradAbroad Supabase project on October 20. Catalogue writes are available only through owner-checked functions; normal clients retain read access only to published programmes. The existing nine static Master's entries are seeded into the database without deleting existing programmes. Both public degree lists now use that catalogue, so owner edits affect the live listings; the old Master list remains solely for legacy shortlist classification.
- Added separate `supabase/owner/grant_owner.sql` provisioning. In an execution-only copy, add `select set_config('app.owner_email', 'APPROVED_EMAIL', true);` immediately after BEGIN. The script requires exactly one active verified account with that approved address, refuses to replace another owner, binds ownership to the auth UUID, and records the grant. The owner's personal address is intentionally not committed to source. Role changes require confirmation at the moment of granting administrative access.
- Validation: 127 tests passed across 13 files, lint passed without warnings, and the production build passed. Nine tests execute the actual migration/functions/RLS in an isolated PostgreSQL-compatible PGlite database, checking anonymous and ordinary-user denial, metadata spoofing, publication visibility, private-data isolation, stale edits, immutable audit access, bans/revocation, pagination, and verified-account provisioning. PGlite is a pinned development-only dependency.
- Browser review used a temporary illustrative-data preview of the actual component. Confirmed edit/unpublish, keyboard dismissal, and phone layouts. Fixed screen-reader-only table heading positioning that caused phone overflow; page and viewport both measured 433 CSS pixels afterward. Removed the preview route. Production ownership was subsequently activated and signed-in browser verification completed as described below.
- Read-only production checks confirmed the existing GitHub `ed8d8f5` release is Ready in Vercel. The user explicitly approved granting ownership to the currently signed-in account after the email mismatch was explained. Verified that account is active and email-confirmed before running the separate provisioning transaction. Live checks under the authenticated database role returned owner access, the expected owner email, and all 19 catalogue entries, while direct programme inserts and private-schema access remained denied. The database migration and owner grant are committed in Supabase. Website commit `92d0cfa` was pushed directly to main and automatically deployed successfully by Vercel (deployment `HLVuEgKQeT8RnN2XRZdAZ9kwko1H`, Ready). Do not rerun the migration on this project. Personal owner addresses and auth identifiers remain absent from repository code.

- Live post-deployment verification: the signed-in `/admin` page returned the approved verified owner, 19 catalogue entries, platform totals, and grant history. Confirmed the Settings owner link, catalogue search, editor loading, and an actual successful save of TU Berlin / IMES without changing its programme fields; the update appeared in the audit history. Both public degree lists loaded nine canonical-level entries each. One older pre-existing record uses capitalized `Masters` and is visible in owner tools but does not match the public degree filters; it was not relabelled or removed during this release. Read-only live database checks also confirmed unassigned authenticated sessions cannot invoke owner overview/catalogue functions and anonymous sessions have no owner-save execution privilege. A live account-to-account UI switch was not performed; automated tests cover account-change invalidation.


## 20–21 October 2026 — detailed public English programme catalogue (local work)

Built a source-linked 200-programme snapshot (100 bachelor’s, 100 master’s, 130 public institutions), public search with degree and requirement filters, programme detail pages, and owner editing/export of the new facts. The owner approved uneven admission groups based on published requirements. Unknown details remain explicitly unverified. See `data/PROGRAM_CATALOGUE.md` for source coverage, the actual group counts, review steps and deployment order.

Prepared additive schema and initial-seed migrations. They preserve existing owner permissions and personal-data policies; repeat imports preserve later owner edits. Existing student shortlists remain intact. These new migrations have not been applied to production as part of this local implementation. The changes have not been committed or pushed yet.

## Your Documents — 21 October 2026

Built the private document library, authenticated file endpoints, server validation, quota/rate controls, and restrictive Supabase Storage policies. Applied the dedicated document migration to the linked production project and verified six backend protections. The existing Vercel Production server secret was found without revealing its value. Code remains uncommitted/undeployed; signed-in production file testing remains a release gate. See `supabase/DOCUMENTS.md` for architecture, limitations, cleanup/recovery, validation, and deployment details. Existing pending catalogue work remains separate and was preserved.

## 21 October 2026 — combined release preparation

The owner requested committing and pushing the completed work. Because the checkout also contains the detailed programme catalogue, applied its schema and seed migrations before pushing to `main`. The preflight found 19 existing programme rows, 17 saved applications, and no name conflicts with the import. Existing rows and saved applications were preserved. The document migration was already applied. Validation before release: 165 tests, lint, production build, seed/JSON consistency, clean whitespace checks, and zero reported production dependency vulnerabilities. Real signed-in production document upload/download/deletion remains to be tested after deployment.


## 21 October 2026 — dropdown and small-text polish

- Added shared theme-aware select styling, comfortable option spacing, mint selection/hover states, keyboard focus rings, and a subtle opening transition. Browsers supporting customizable native selects use the themed popup; other browsers retain their functional system popup. Reduced-motion preferences are respected. Settings/mobile navigation links also have clearer hover and focus states.
- Increased all explicit font sizes of 10px or smaller to 12px across the application, including miniature homepage labels and notification badges. Adjusted the mobile workspace preview header to fit the larger text. Existing 11px text is unchanged.
- Validation: 165 tests, lint, production build and whitespace checks passed. Source scan found no remaining explicit pixel declarations at 10px or below. Local Chrome desktop/mobile checks covered popup appearance, keyboard selection/dismissal, filtering, and homepage preview layout without horizontal overflow.
- Release: the user approved committing and pushing this styling update to `main`. No Supabase changes are needed. Deployment readiness must be checked separately after the push.
