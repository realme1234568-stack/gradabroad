# Application tracker workspace — 24 October 2026

Replaces the default horizontally scrolling tracker with a responsive workspace in the existing GradAbroad palette. Both tracker URLs still share the same component.

## Features

- Overview: saved application count, applied/interview count, accepted offers, shared document progress.
- Deadline attention: shortlisted applications due within 30 days or already overdue, with a one-click review filter. Free-text legacy deadlines remain visible but are not treated as calendar dates.
- Cards, status board, and document comparison matrix. Status changes use the existing options and persist independently from checklist saves.
- Search university/program/notes, degree and status filters, sorting by deadline, recent saves, university, or document progress.
- Application cards show saved notes, safe program links, deadlines and per-application preparation progress. Details remain editable in My Shortlist.
- Core and per-application custom document checks, progress indicators, duplicate label validation, confirmed removal of custom labels, and explicit guidance that checks are not verified files or universal admission requirements.
- CSV download for the currently filtered applications, with CSV quoting and spreadsheet formula neutralization. Export includes private notes; the file is generated locally and is not uploaded to another service.
- Phone layout places applications first and shows a fixed save panel for unsaved checklist edits. Reduced-motion settings are respected.

## Persistence and access

No database migration or new storage bucket is required. Uses the existing owner-scoped shortlists and tracker_preferences tables, with explicit user filters and fresh account checks before writes. Pagination avoids dropping saved applications above the API row limit. A status update is only reflected after its database response confirms the matching row. Failures retain the previous status or unsaved checklist draft. Account-switch callbacks clear the previous account's displayed programs and checklist state.

Existing account-keyed checklist drafts and navigation warnings are preserved. Browser back/forward navigation is not intercepted; in-memory drafts can be restored on remount. Drafts are not durable across browser closure.

## Validation

All 208 automated tests pass. Automated coverage includes persistence/remount, failed saves and status updates, legacy statuses and degree classification, custom entries, account changes, filtering, view switching, document progress, deadline attention and CSV safety. Lint and production build pass. Desktop and phone visual review used an isolated server-rendered preview of the actual workspace component with clearly labelled sample data; authenticated browser interaction against production was not performed for this redesign. No real account data was inserted for the visual preview.

Prepared for publication to main at the user’s request, including the settings-dropdown Notifications removal. Vercel deployment must be confirmed separately.
