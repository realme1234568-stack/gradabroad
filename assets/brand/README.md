# GradAbroad identity — 21 October 2026

The new identity is a mint G monogram on charcoal. The adjacent website wordmark remains live text. The master is an AI-generated raster asset, not an editable vector or a registered trademark.

## Files to use

- `public/brand/gradabroad-instagram-1080.png`: 1080 × 1080 square avatar with enough space for Instagram's circular crop.
- `public/brand/gradabroad-logo-512.png`: general-purpose square logo.
- `public/brand/google-app-logo-120.png`: Google's recommended 120 × 120 app-logo upload.
- `public/brand/gradabroad-social-card.png`: 1200 × 630 website sharing card.
- Other exports supply header marks, 16/32px favicons, ICO and Apple touch icon.

Re-export using `node scripts/export-brand-assets.mjs`. The original master is `gradabroad-source.png`. Exports keep the same approved mark instead of regenerating variants.

## Google sign-in findings

The actual Supabase Google client was matched to the existing Google Cloud project before editing. The app name was already **GradAbroad**; the project was in **Testing**, had the old globe logo and no public homepage/privacy/terms links. Saved the correct public links and uploaded/saved the new 120px logo in Google branding. No OAuth client, secret, redirect URI, scopes or Supabase security settings were changed.

Google brand verification can be required to show the app name/logo instead of the Supabase project hostname; changing website metadata does not control Google's account picker. See [Supabase's Google setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google) and [Google's branding guidance](https://support.google.com/cloud/answer/15549049?hl=en-uk).

The owner explicitly approved publishing Google sign-in and proceeding with verification. Confirmed **In production** in Google Audience. No sensitive or restricted scopes are configured. Google's branding check reported two blockers: the homepage domain was not verified for this account, and 13 authorised domains exceeded the limit of 10.

## 22 October 2026 — verification follow-up

Removed the two literal placeholder domains (`your-prod-domain.vercel.app` and `YOUR-PROD-DOMAIN.vercel.app`) and the unused `gradabroad-3d7uljyux-shreyansh-tripathis-projects-3de82fa9.vercel.app` entry. A fresh branding-page read confirmed exactly 10 saved authorised domains. Existing client redirect URIs and credentials were not changed.

After separate explicit approval for Search Console ownership, saved Google's root TXT ownership-verification record through GoDaddy. The DNS console confirmed success and listed seven records. Existing website, nameserver and email records were preserved; Google was not delegated access to the GoDaddy account. Public DNS propagation and Search Console verification must be confirmed separately. Google's branding issue instructs waiting 24 hours after ownership verification before retrying branding. Final brand approval and the account-picker appearance are not yet confirmed. Website identity changes remain local and uncommitted.

Verification attempt on 22 October: Search Console could not yet find the TXT token. Both authoritative nameservers also returned no root TXT record at the time of checking. GoDaddy lists the correct saved token and reports that propagation usually takes up to an hour (exceptionally up to 48 hours). Ownership has therefore not yet been verified; retry once DNS propagation completes, then observe Google’s 24-hour branding wait.

## Website release — 23 October 2026

The owner authorised committing and pushing these website assets and integrations to main for their Vercel review. The earlier local-only notes are historical. Google's independent branding verification remains pending; deploying the website assets does not resolve that verification.
