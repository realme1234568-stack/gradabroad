# Deploying the readiness fixes

This branch contains the cleanup and readiness fixes. The database migration must be applied before the updated application is used against the existing Supabase project.

## Required order

1. Apply `supabase/migrations/20261009190000_persist_checklists_and_notes.sql` to the Supabase project used by the preview. This is an additive migration: it adds the missing shortlist note/program-level columns if necessary and a private per-user checklist table. Do not rerun the entire schema.sql on an existing database.
2. Deploy this source to a preview branch.
3. Sign in, confirm existing programs show Already Shortlisted, edit a note/status/deadline, and refresh to verify persistence.
4. On My Tracker, check a document, add a custom document, click Save checklist, and refresh. Verify that the changes remain. Changes to application statuses save separately.
5. Verify with two test accounts that one account cannot read or change another account's checklist. The migration enables row-level security and requires auth.uid() to match user_id.
6. Promote only after those integration checks pass.

Checklist changes are explicitly saved with Save checklist. Save failures preserve edits for retry. A browser refresh/close warning protects unsaved changes, but internal app navigation can still discard unsaved edits. Concurrent tabs use last-save-wins behavior.

## Validation completed locally

- ESLint: zero errors and warnings.
- TypeScript: passed.
- Production build: passed with placeholder public Supabase variables; this checks compilation and prerendering, not live database connectivity.
- Five component regression tests passed: checklist persistence across remount, save failure/retry, failed-load protection, account-change save protection, and catalogue recognition/metadata updates.
- Tests use a mocked Supabase service. The SQL migration and live database isolation have not been executed or verified in these tests.

Existing unrelated limitations, including disabled GitHub authentication and document uploads, remain.
