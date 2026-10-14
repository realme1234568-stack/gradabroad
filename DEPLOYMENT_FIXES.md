# Deploying the readiness fixes

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
