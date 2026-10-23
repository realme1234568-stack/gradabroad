# Your Documents

Implemented on 21 October 2026 in the approved production-review checkout.

Launch follow-up, 22–23 October: the owner reported completing the two-account production document-isolation test. The agent did not independently repeat or certify that test in the launch review. See `docs/LAUNCH_REVIEW_2026-10-23.md` for the distinction and `docs/PRIVACY_SUPPORT_OPERATIONS.md` for account-deletion/file-cleanup procedures and backup limitations.

## User experience

- `/dashboard/your-documents`, reachable from the dashboard, tracker, Settings page, and account menu.
- PDF/JPG/PNG uploads, category filters, upload progress, private downloads, and an explicit permanent-deletion confirmation.
- 3 MiB per file, 50 files / 150 MiB per account, 30 upload attempts per hour. These safety limits apply to the owner account too.
- The document library and preparation checklist are separate. Uploading does not complete a checklist or submit an application.
- No inline PDF preview, sharing feature, third-party document analysis, or browser persistent storage of document contents.

## Access model

- Dedicated `student-documents` bucket, `public = false`, with a MIME allowlist and byte limit.
- `student_documents` metadata uses forced row-level security. Authenticated users can SELECT their own rows only. Browser INSERT, UPDATE, and DELETE are not granted.
- Restrictive Storage policies prevent broad policies on other buckets from granting access to this bucket. Reads require an owned, ready metadata record. Browser writes, moves/overwrites, and deletion are denied.
- Every application API call verifies the user with Auth `getUser`, rejects unverified/anonymous accounts, and checks the page's account identifier against that verified identity. User IDs in request bodies are not trusted.
- Mutation endpoints require a matching Origin; cross-site requests are rejected. Responses include private/no-store cache controls for browsers/CDNs, nosniff, no-referrer, and a sandbox CSP.
- Downloads use the student's Supabase client/JWT and Storage RLS, **not** the privileged writer. Files are delivered as attachments, never executed/rendered within the application origin.
- A server-only `SUPABASE_SERVICE_ROLE_KEY` performs validated writes and cleanup. The module imports `server-only`; the key has no `NEXT_PUBLIC_` prefix. No service key was read, copied, or committed during implementation.
- Ordinary application owner privileges do not grant document access. Supabase/Vercel operators with privileged infrastructure access are still trusted parties. This is not end-to-end encryption and does not promise zero risk.

## Validation and failure handling

- Bounded raw-body reader enforces the size limit even without Content-Length. Filenames are sanitized display metadata; generated UUID object keys contain no filenames or emails.
- File contents and extensions must match. Images are decoded and re-encoded, removing EXIF/location metadata and trailing data; pixel/time limits constrain processing.
- PDFs must parse, be unencrypted, have a complete ending, and contain 1–200 pages. Active actions, interactive forms, embedded files, and associated content are rejected. Parsing happens in a worker with a 64 MiB old-generation heap limit and a five-second deadline. Original accepted PDF bytes are preserved.
- File validation is **not antivirus scanning or a guarantee against all malicious documents**. No external scanning service receives student documents. Users should retain originals and keep their own PDF/image software updated.
- Private database counters enforce upload rates across instances. Advisory locks serialize per-account quota reservations, including pending uploads.
- Uploads reserve a metadata row before storing bytes and mark it ready only after success. Failed cleanup retains a private pending record for recovery instead of hiding an orphan. Pending records can be deleted after ten minutes, avoiding a race with a still-running upload.
- Deletion removes bytes through the Storage API first, then metadata. Any failure is surfaced; the UI does not falsely claim success. Retry completes partial deletions.
- Account switches clear files, selected uploads, dialogs, and messages; outstanding requests are aborted and stale responses ignored. Download object URLs are short-lived in memory.
- Account deletion must first delete stored objects via Storage; the auth foreign key deliberately restricts deleting an account that still has document rows. A future account-deletion feature must perform that cleanup before deleting the Auth user. Never remove Storage metadata with SQL as a substitute for deleting object bytes.

## Applied backend and release

The migration `20261021100000_private_student_documents.sql` was applied to project `fshixuzamlsmhsrckzzk` through its signed-in Supabase SQL editor. The migration version was recorded in the migration history when that history table existed. Six live checks passed: private bucket/size limit, forced metadata RLS, forced quota RLS, denied client metadata writes, denied client reservation execution, and four restrictive Storage fences.

Vercel's GradAbroad environment list already contains `SUPABASE_SERVICE_ROLE_KEY` as a **Production** secret. Its value was not revealed or tested. Public URL/anon variables exist for all environments. The privileged key is not listed for Preview: uploads/deletion intentionally fail closed there unless a separate staging project's backend and secret are configured. Do not casually copy the production service key into untrusted PR previews.

The initial document implementation was completed without committing or deploying. In the subsequent 21 October release preparation, the owner requested a commit and push. The programme schema and 200-record catalogue migrations were then applied before releasing the combined checkout, so its catalogue pages have the required backend. See `DEPLOYMENT_FIXES.md` and Git history for the release record.

Before enabling student uploads in a release, verify a real upload/download/deletion with disposable documents, two separate signed-in accounts, logout, and refresh against that deployment. The checks in this task use synthetic files/accounts, isolated PostgreSQL policy execution, and a local application build; they do not constitute a signed-in production end-to-end file test.

## Validation

- 29 document-specific tests: PostgreSQL RLS/storage fences and quotas; API authentication/ownership/CSRF/failure handling; real PDF/image validation; UI upload confirmation, deletion failure, filtering, account switching, and retry.
- Full suite: 165 tests.
- Production build uses dummy public configuration for local checking; it does not contact student accounts or process real documents.
- The compiled Next.js app completed a synthetic PDF upload (201), owner download (200 with identical bytes), deletion (200), and empty-library reload. A second synthetic account received 404 for that document. Auth/database/Storage were local test doubles for this compiled-app smoke check; production RLS was tested separately in isolated PostgreSQL and the applied live configuration was inspected. This caught and corrected public-Host handling behind Next's internal hostname and verified the worker/package-tracing configuration. It is not a production file test.
- Upgraded Next.js, its lint config, Sharp, jsPDF, and compatible transitive dependencies after the package audit reported vulnerabilities. Small existing ref/state and navigation issues were corrected for the updated lint rules.
- Production dependency audit: zero reported vulnerabilities after the updates. Full dependency audit still reports the five related high-severity development-only lint/glob advisories through `braces`/`micromatch`; the suggested automatic fix downgrades the lint framework and was not forced. This is a point-in-time audit, not a security certification.

UI evidence includes a clearly labelled static design preview with synthetic document records; no real passports or transcripts were used.
