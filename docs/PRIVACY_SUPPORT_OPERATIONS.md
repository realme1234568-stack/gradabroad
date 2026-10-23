# Privacy, support and account requests

Reviewed 22–23 October 2026. This is an operator procedure, not legal certification or an automated deletion service.

## Confirmed facts

- Public service/contact: GradAbroad, New Delhi, India; `gradabroad.online@gmail.com`. The owner confirmed receiving mail there on 22 October. No test email was sent by the coding agent.
- The owner supplied the brand and city/country again, not the name of a legal person or registered entity or a full publishable address. Those details remain unconfirmed. Do not describe GradAbroad as an incorporated company or invent an address.
- Supabase project General settings showed **South Asia (Mumbai), ap-south-1** and the organisation's **Free** plan on 22 October. This is the project's primary region, not a guarantee that all provider processing stays there.
- The Supabase Backups page explicitly said **Free Plan does not include project backups**. No recovery backup or restore drill was created in this review. Source code in GitHub is not a backup of student data or Storage files.
- Hosting and feedback use Vercel and EmailJS respectively. Exact configured Vercel function regions, ancillary provider retention and transfer arrangements were not independently established in this review. Do not make EU-only storage or exact global erasure promises.
- Existing accepted Terms/Privacy version `2026-10-21` was preserved. The Contact and Settings changes explain how to exercise existing rights; they do not silently replace accepted policy text.

## Inbox procedure

1. Check the official mailbox each working day; prioritise suspected unauthorised access and loss of account access.
2. Log only the received date, request type, account reference after verification, status, applicable response deadline and completion date in a private operator record. Never commit requests, addresses, documents, exports, verification evidence or that record to Git.
3. Acknowledge receipt promptly. For a technical report, ask for the page, expected/actual behaviour, browser and a redacted screenshot when useful. Never ask for passwords, magic links, cookies, access tokens or unredacted identity documents in an ordinary support message.
4. For account data, correction, export or deletion, verify control of the **actual authentication email**, not the editable profile contact email, a display name, or an email address typed into a forwarded message. If there is doubt, use a proportionate account-control check and resolve it before disclosure/deletion. Do not use another person's private data to prove identity.
5. Track the law applicable to the request. Where GDPR applies, the ordinary response period is one calendar month; any permitted extension and its reason must be communicated within that first month. Do not silently restart the clock or promise an unverified deadline for every jurisdiction.
6. Explain any lawful limitation or retention exception. Send completion details to the verified requester and record the action without keeping unnecessary copies of their content. Do not treat support messages as marketing consent.

## Data access and correction

1. Confirm the verified Auth UUID and requested scope. Keep this UUID out of public issues and screenshots.
2. The user can correct supported profile/planning fields in the workspace and download their own files through Your Documents. Profile email edits do not change authentication identity.
3. For an operator-assisted export, collect only the verified account's records: `account_data`, `shortlists`, legacy `application_tracker`, `tracker_preferences`, `notifications`, document metadata and relevant `app_private.legal_acceptances`. Include stored file bytes only when requested. Check the live schema for other user-linked records first.
4. Do not export the full database, another account's records, service credentials, internal security details or unrelated owner audit records. Review the export for account isolation before delivery.
5. Agree an authenticated or encrypted delivery method with the requester; never publish an export as a public Storage URL or attach sensitive files to an unverified address. Delete temporary working copies after confirmed delivery and resolution, except for a documented lawful need.

## Account deletion — verified requests only

These are manual steps for an authorised infrastructure operator. No account was deleted during this review. Obtain the specific verified request and final operator confirmation before any permanent action. Rehearse with a designated disposable test account before the first real deletion.

1. Match the verified sign-in identity to exactly one Auth UUID. If it is the platform owner, stop and resolve ownership continuity separately; do not delete the owner as routine support.
2. Offer the chance to download required files. Explain that deleting an account also removes its saved planning records and documents. Record any narrow lawful retention exception separately.
3. Temporarily prevent further writes by that account while processing the request. Account deletion alone is not proof that all previously issued JWTs immediately stop working; confirm the current session/revocation behaviour and do not weaken RLS to carry out a request.
4. Inspect `student_documents` **for that UUID only**, including `pending` records, and list Storage objects under that account's UUID prefix in the private `student-documents` bucket. Do not open document contents. Check every object path and follow pagination. Never use a bucket-wide delete.
5. Remove those file bytes using the **Supabase Storage API or Storage dashboard** first. Check each result, retry failures, and confirm that the account's object prefix is empty. **Do not delete `storage.objects` rows using SQL**: that is metadata removal, not file deletion.
6. Only after byte deletion succeeds, remove the corresponding `student_documents` metadata through the privileged backend, scoped to that exact UUID. This table intentionally uses `ON DELETE RESTRICT` to prevent orphaning files by deleting Auth first. Stop on any mismatch or error.
7. Delete the verified Auth user through Supabase Auth's supported administration flow. The repository migrations define cascading deletion for `account_data`, `shortlists`, legacy tracker rows, `tracker_preferences`, `notifications`, upload counters, legal receipts and owner-role membership. Recheck live foreign keys before relying on them; do not disable constraints or change policies to force deletion.
8. Verify Auth removal, zero remaining account-scoped planning/document/receipt/counter rows, no associated Storage objects and denial of subsequent private-data access. `app_private.owner_audit` is a separate immutable operational record, not automatically erased; review a relevant entry individually under the applicable lawful exception.
9. Clear temporary exports/support attachments and record completion. Explain provider operational-record or backup limitations accurately. If a backup is later restored, reapply verified deletions before restoring public service. Do not restore a deleted person's data to active use silently.

## Retention and recovery register

| Data | Current handling / limitation |
| --- | --- |
| Active planning/profile data and documents | Kept until the user removes supported content or a verified account-deletion request is processed. No inactivity purge is implemented. |
| Legal receipts | Account-bound; cascade with Auth deletion. Already accepted text/version must remain traceable. |
| Routine support messages and temporary exports | Manual handling. Remove unnecessary working copies after resolution. A formal retention schedule and mailbox deletion practice still need to be adopted and recorded; do not claim an automatic purge exists. |
| Supabase operational logs | Provider-managed. Current public plan documentation and actual account features must be checked for the specific log category; this review does not establish a universal retention period. |
| Vercel runtime logs | Public documentation lists one hour for Hobby; this does not cover every Vercel operational/security record or prove project-specific exports are absent. |
| Database backups | Current Free project has no included project backups. Establish encrypted off-site backups and a restore drill, or choose a suitable provider plan, before broad launch. No paid change is authorised by this procedure. |
| Uploaded-file backups | Separate from database backups: database dumps/backups contain Storage metadata, not the object bytes. Copying private files to a new provider requires an approved secure destination, access controls and retention/deletion handling. |

Keep backups encrypted, access restricted, outside the repository and public web directories. Record backup time, expiry, location and restore-test result. Use a minimal documented retention window and make verified deletions effective after a restore. No recurring automation was installed.

## Security incident response

1. Record the reported time, affected feature and minimum necessary evidence privately. Do not ask a reporter to download someone else's files.
2. Contain an identified exposure using the narrowest safe control. Do not publish credentials or victims' details in issues, screenshots or status updates.
3. Preserve only the evidence necessary to investigate, identify the affected scope and obtain qualified advice on applicable authority/user notifications and deadlines. Notify as required; a generic privacy checkbox does not replace incident obligations.
4. Validate the correction with two disposable accounts, document the result and inform affected people through an appropriate verified channel where required.

## Remaining operator decisions

- Identify the actual legal operator/controller and an appropriate publishable contact address; review applicable law, age/parental-authorisation arrangements and provider transfer terms with a qualified adviser.
- Establish and rehearse encrypted database **and file** backup/recovery.
- Adopt a support/incident-record retention schedule and confirm relevant provider regions/retention/transfer arrangements. A plan's user-visible log history is not the provider's entire data-retention policy.
- Confirm the daily mailbox process and rehearse a verified deletion/export request using a designated test account.

## Primary references checked

- [Supabase user management](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase Storage object deletion](https://supabase.com/docs/guides/storage/management/delete-objects)
- [Supabase database backups and Storage limitation](https://supabase.com/docs/guides/platform/backups)
- [European Commission: dealing with individuals' requests](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/dealing-requests-individuals_en)
- [Vercel runtime log retention](https://vercel.com/docs/logs/runtime)

These sources support the procedure; they do not certify GradAbroad's compliance or determine every law applicable to its users.
