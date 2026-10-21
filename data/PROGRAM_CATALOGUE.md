# German public-university English programme catalogue

Initial editorial snapshot: 100 bachelor’s and 100 master’s programmes across 130 public institutions. Research and review took place on 20 October 2026 UTC (21 October in Berlin for the final checks).

The owner approved keeping 200 programmes with uneven, evidence-based groups instead of forcing 25 entries into each category.

| Published-requirement category | Bachelor’s | Master’s |
| --- | ---: | ---: |
| More demanding requirements | 8 | 18 |
| Additional selection requirements | 38 | 50 |
| Standard entry requirements | 41 | 31 |
| Open admission | 13 | 1 |
| Total | 100 | 100 |

These are editorial descriptions of published conditions, not university rankings or acceptance probabilities. In particular, an unrestricted programme can still require specified grades, subject credits, language certificates, tests or credential recognition. Standard entry requirements does not mean unrestricted admission.

## Sources and coverage

`programs-germany-english.json` holds the initial facts, permanent import identifiers and source links. Each record links its university-provided DAAD International Programmes profile, university programme page and application/fee instructions. Requirements are paraphrased; source descriptions, photographs, logos and full syllabuses are not republished. This is a manually maintained catalogue, not a licensed data feed or a production scraper.

The research screened the DAAD 2026/27 English-only bachelor results and a broad selection of English-only master results, then cross-checked university pages. Excluded providers include private/state-recognised private institutions, German-campus brands offering the listed degree only overseas, ambiguous bilingual degrees without an explicit full English route, and distance-only leads. Public university does not mean tuition-free. Joint degrees and full English tracks are identified where applicable; German language classes or certificates can still be compulsory.

Important cross-checks include Anhalt’s separate English IBS branch and German programme, Leuphana’s need for an English minor, Saarland’s competitive computing routes, TUM tuition and German requirements, the new and old TOEFL scales, and moved programme links. The Worms Global Trade Management lead had a broken university programme link and was replaced before import; the existing saved applications are unaffected.

The snapshot deliberately does not invent missing facts:

- ECTS totals are documented for 89 programmes; the remaining 111 display “Not yet verified”. Totals are not calculated from semester count.
- A provider fee quotation with an unspecified/historical period is labelled accordingly. Separate components are not summed into a made-up current total. University exemptions and nationality-specific rules remain authoritative.
- Where an application window does not name an intake year, the page asks applicants to verify the year. Recognition/VPD and scholarship deadlines can be earlier.
- Certificate examples are not the entire accepted-test list; component scores, validity, exemptions and TOEFL scale remain important.
- The full applicant-specific document checklist is not independently reproduced for all 200. Programme-specific selection documents appear in the academic summary; the university checklist supplies the complete list.
- A successful automated shape/count test verifies data consistency, not the factual correctness of an admission rule. Changes still require source review.

## Manual review every 10–15 days

1. In the owner dashboard, export the catalogue before making changes. The export includes review date, requirements, intake, deadlines, fees and source URLs.
2. Open the university’s current programme, admissions and fees pages. Use the DAAD profile as a supporting provider source; prefer current university rules if they differ.
3. Check the full English study route, degree award, campus, duration, ECTS, intakes and whether the programme is accepting new applicants.
4. Review degree/grade/subject-credit prerequisites, selection assessments, accepted language tests and scales, validity, exemptions, German requirements, documents and applicant-specific recognition/APS/VPD conditions.
5. Review application windows for each applicant group and intended intake year, tuition, semester contributions, additional charges and exemptions. Do not carry a historic quote forward as current.
6. In Edit program → Program information & sources, update the checked facts and the review date (UTC calendar date). Save. The existing revision check prevents overwriting a newer owner edit; reload if a conflict is reported.
7. Reclassify only from published evidence. If the details cannot be established, leave the field blank or explicitly unverified; choose Admission review pending when the group itself is uncertain. Unpublish a discontinued or no-longer-English programme. Do not delete its saved student applications.
8. Verify the public programme page and search, export again, and record any changed facts in the project review log.

The page displays a review-due label after 15 days. No automatic scheduler has been created; the owner requested manual reviews.

## Database and release order

The code requires the additive schema migration before release. The initial seed does not change account, profile, shortlist, notification, document or storage policies.

1. Apply `supabase/migrations/20261020190000_program_details.sql` to the intended Supabase project.
2. Apply `supabase/migrations/20261021010000_german_english_catalogue.sql` to that same project. It runs in a transaction and stops on a conflicting existing university/course name rather than silently losing an entry.
3. Confirm `search_english_programs('bachelor','','all',0)` and the equivalent master call report 100 each. Check that anonymous visitors cannot access drafts or invoke owner functions.
4. Deploy the code through the normal Git/Vercel workflow and test search, pagination, a detail page and shortlist saving with a real signed-in test account.

The initial import preserves all existing programme rows and student shortlists. Legacy rows without reviewed public/English metadata are omitted by the new discovery query. Reapplying the initial seed never overwrites later owner changes or publication decisions. For future live reviews, use the owner editor; the JSON is the initial snapshot, not an automatic overwrite of the live catalogue.

If editing the initial JSON before first release, regenerate the matching SQL with `node scripts/build-program-seed.mjs`. Validate consistency with `node scripts/build-program-seed.mjs --check` and run the test suite, linter and production build. Do not rerun the seed expecting it to update owner-edited live rows.

## 21 October 2026 release preparation

Applied both catalogue migrations to Supabase project `fshixuzamlsmhsrckzzk` before pushing the combined catalogue/document release to `main`. The preflight found no university/course-name conflicts. Existing programme rows and saved applications were retained. See the release log in `DEPLOYMENT_FIXES.md` for verification and deployment status.

## Validation

The change adds database-executed checks for metadata, owner revision preservation, invalid/future dates, public search filters, all 200 imported records, complete pagination and repeat-import preservation. UI tests cover degree/search/group/page filters, retries and out-of-scope responses. Dataset tests check counts, uniqueness, source links and metadata shape. Desktop and phone-width visual checks covered the catalogue search layout, the open-admission filter, detail navigation and horizontal overflow. Local visual QA uses a public-data-only fixture; it does not authenticate a real student or verify signed-in production flows. The complete 136-test suite, lint and production build passed; the database/data tests were also rerun after the final fee clarifications.
