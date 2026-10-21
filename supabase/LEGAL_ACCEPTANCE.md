# First-sign-in legal acknowledgement — 21 October 2026

## Implemented behaviour

- Public Terms (`/terms`), Privacy (`/privacy`) and Contact Us (`/contact`) pages, linked from the homepage footer and the shared Settings dropdown.
- Official public contact supplied by the owner: **gradabroad.online@gmail.com**, GradAbroad, New Delhi, India. No registered entity or full street address was supplied, so none was invented.
- Google, GitHub and email-link entry points show the same accessible, theme-aware dialog before authentication unless the current browser has already shown this version. The Terms acceptance and Privacy acknowledgement are separate, initially unchecked controls. No optional marketing/data-use consent is bundled into them. Cancel/Escape starts no authentication. Public pages remain readable without accepting.
- A successful prelogin POST sets a 15-minute HttpOnly, SameSite=Lax cookie scoped to `/auth/callback`. It is an acknowledgement intent, **not** proof of identity, an access credential, or a database acceptance. Callback consumes/clears it, verifies the actual account with Auth, and checks/writes that account's database receipt.
- Browser storage is only a presentation hint. It cannot satisfy server-side receipt checks. A different account using that browser must still have its own receipt. A new device, cleared browser storage, expired/missing pending cookie or an email link opened elsewhere can result in the notice appearing again; an unknown Google identity cannot be checked before Google authenticates it.
- Returning accepted accounts bypass onboarding after the callback. Accounts that predate this release have no receipt, so they receive a one-time agreement on their next protected-page visit/login. A failed DB check/save never silently counts as acceptance.
- Protected workspace pages redirect to `/legal/accept` until a receipt exists. That page supports retry, sign-out and account-switch invalidation. Authentication and the underlying private-data policies remain the security boundary; this UI gate is not advertised as a new universal RLS restriction on all planning tables/APIs.

## Backend and release order

`migrations/20261021140000_legal_acceptance.sql` was applied to the production project **fshixuzamlsmhsrckzzk** through its SQL editor on 21 October 2026. Do not rerun it against that project. The local CLI was not linked and was not used to apply migrations.

The additive migration creates a private, RLS-enabled receipt table keyed by `(auth.uid(), version)`, and two narrowly scoped RPCs. Anonymous execution and direct client table access are denied. The acceptance RPC rejects anonymous, unverified, deleted and banned accounts and unsupported versions. Repeated acceptance preserves the first server timestamp/source. It never accepts a caller-provided user ID. No IP address, fingerprint, existing profile/document/shortlist data, or real-account acceptance was inserted as part of testing.

Live read-only verification returned RLS enabled; zero receipts; authenticated direct SELECT/INSERT denied; anonymous accept execution denied; authenticated account-scoped execution allowed. The account count remained 15. The owner approved committing and pushing the website changes to `main`. The backend was applied before that release. Production deployment and live login verification must be checked separately after the push.

For another project, apply this migration **before** deploying the new login code. If it is missing, the protected-page agreement check will fail closed. For future material policy changes, preserve the published text/version, add the next allowed version through a migration, then update the UI constant and request renewed agreement. Never rewrite an already-accepted version in place.

## Validation and limitations

- Local tests exercise real PostgreSQL function execution in PGlite: account isolation, immutable first acceptance, denied anonymous/direct access, banned/unverified accounts and invalid versions.
- Route/UI tests cover unchecked controls, cancellation, persistence failure, CSRF/origin rejection, bounded request bodies, mismatched account headers, callback persistence/redirects, refreshed cookies, presentation hints and stale responses during an account switch.
- Browser checks used localhost and a dummy public-data service, without submitting acceptance or signing a real account into these new terms. Desktop and phone layouts, policy switching, cancellation and Contact Us were inspected. Production first-login/returning-login verification remains pending deployment; automated tests do not replace that check.
- This task does **not** complete the earlier outstanding two-account production document-isolation test.

## Legal review still required

This is an implementation and a substantial first draft based on the actual product, **not a certification of legal compliance or immunity from claims**. Before presenting it as legally final, a qualified adviser should confirm the full legal operator/controller identity and publishable address, applicable Indian/EU/other rules, age/parental-authorisation arrangements, actual provider regions/transfer mechanisms, log and backup retention, support/deletion handling, and whether any activity needs a separate consent flow. The operator supplied a brand name, city/country and email, not a verified registered business identity. No claim is made that a broad checkbox substitutes for these duties.

Primary drafting references checked on 21 October 2026:
- [EDPB: lawful processing](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en)
- [EDPB: granular consent separate from general conditions](https://www.edpb.europa.eu/sme/find-practical-info/faq_en?page=1)
- [European Commission: individual data rights](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [MeitY: Digital Personal Data Protection Act 2023](https://www.meity.gov.in/static/uploads/2024/02/Digital-Personal-Data-Protection-Act-2023.pdf)
- [MeitY: DPDP Rules 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025)

The references inform the draft; they do not establish that GradAbroad has completed every operational requirement or that every provision has already commenced.
