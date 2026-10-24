# Personal shortlist programs — 24 October 2026

Users can add a university and program outside the catalogue directly from My Shortlist. Entries remain in the existing owner-scoped `shortlists` table, appear in the application tracker, and are not published in the catalogue.

## Available details and controls

- University and program, Bachelor’s or Master’s, application status, deadline, optional website, and private notes.
- Edit saved details; manual university/program names can be corrected, while catalogue names remain read-only.
- Search, degree/status filters, sorting within degree groups, upcoming-deadline counts, and confirmation before removal.
- Browse Programs prominently links “Can’t find your dream university? Add it manually here.” to My Shortlist.
- New catalogue saves carry the official program link when available. Existing entries are preserved and can have a link added manually.
- Failed saves retain the draft; failed removals retain the entry. Account changes clear the previous account’s local data and draft.
- Unsaved drafts warn before refresh/closing, ordinary link navigation, or cancellation. Browser history navigation is not covered by the link guard.

## Database and verification

Migration `20261024090000_personal_shortlist_programs.sql` adds `entry_source` and `official_url` and validates manual names and website format. It does not broaden grants or row security policies. Applied to production Supabase after a verified encrypted backup; existing shortlist values were checked unchanged within the migration transaction. The Mac backup recovery source includes the new migration.

Live transaction tests verified owner insert/read, rejection of forged ownership, second-account read/update/delete isolation, and anonymous read isolation. All test rows and generated notifications were rolled back. Local database tests also cover ownership reassignment and constraints.

Validation: 198 automated tests passed, lint passed, and the production build passed. The Browse Programs message and its shortlist destination were checked in the browser. The signed-in local visual review remains incomplete because the production OAuth configuration redirects local sign-in to the live site; no authentication bypass is included.

Prepared for publication to the main branch at the user’s request. Vercel deployment must be confirmed separately. No paid service was added.
