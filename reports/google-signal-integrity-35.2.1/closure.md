# PFOTENTECHNIK 35.2.1 — GOOGLE SIGNAL INTEGRITY CLOSURE

**The single P1 is closed in the final production build; the confirmed lifecycle/schema leak is removed. P0 = 0; P1 = 0.** No new/deleted public URL, redirect, sitemap, timestamp, scoring, affiliate or broad UI/content change was made by this closure task.

## Changes

One conditional contextual link from `/smarte-futterautomaten/` to `/futterautomat-berater/` in the existing CategoryExperience “Anforderungen zuerst” section. The real `<a>` is in initial HTML, outside navigation/footer, and explains the six-question selection. It uses existing styling. Final graph: one meaningful source, depth 2, no redirect. See [internal-link-closure.md](internal-link-closure.md).

Neakasa's internal route-owner sentence was incorrectly stored as a product caution and weakness. Removed both copies, kept routing ownership only as a private YAML comment, and removed the same workflow phrasing from its Markdown prose. No mapper/schema redesign or runtime blacklist. Three source-boundary regression tests cover all 103 products; actual generated public text/schema also contains no identified workflow label. See [schema-regression.md](schema-regression.md).

## GSC cohort — explicitly not reconstructed

**GSC_URL_EXPORT_MISSING.** Repository/workspace/import paths, supplied Codex attachments and likely export filenames were searched. Only performance snapshots were available. No approximately-18-URL cohort was inferred from memory, impressions or graph position.

Phases 5–7 stop here; the production fixes proceed independently. URLs analyzed: **0**. Technically clean / weak support / material-defect cohort counts: **not measurable**, not zero. Cohort-vs-control result: **INSUFFICIENT_DATA**. `gsc-not-indexed-correlation.csv` is header-only by design; `gsc-cohort-comparison.csv` contains real 35.2 control metrics and blank unavailable cohort values. No last-crawled dates invented. URL-level exclusion causality remains unassessed.

## Internal graph and schema

- True orphans: **0**, previously 1; no newly orphaned page.
- Near-orphans: **5** under the unchanged mechanical rule: the four original pages plus the advisor's intentional single hub source. A second link solely to improve this metric was rejected.
- Homepage depth >3: **0**; unreachable canonical pages: **0**.
- Four original near-orphans: two archived products retain appropriate manufacturer access; the active RFID product and supporting senior-dog guide need no demonstrated additional journey in this scope. Individual decisions are in internal-link-closure.md.
- Products checked: **103**; lifecycle leaks **0**; semantic invalid **0**; JSON syntax **103/103 valid**.
- Warning products **103**: prior 102 warnings retained, repaired Neakasa now also has only ordinary warning status. Wording differences are not automatically errors. All editorial ratings remain unchanged from 35.2; no fabricated ratings/reviews or publisher-as-merchant implication found.

## Signal baseline and evidence boundaries

| Signal | Result | Evidence |
| --- | ---: | --- |
| Generated HTML | 375 | Final full production build |
| Indexable canonical URLs | 260 | Final HTML/graph |
| HTTP 200 | 260/260 | Reused 35.2 production measurements |
| Self canonical | 260/260 | Final local HTML; declared live canonicals retained from 35.2 |
| Sitemap | 260/260 | Final build; XML byte-identical to 35.2 |
| Robots | 260/260 | Final HTML; HTTP header baseline reused |
| Initial HTML | 260/260 | Final build |
| Canonical internal link occurrences | 16901/16901 | Final anchor graph |
| Schema URL consistency | 260/260 | Final JSON-LD |

This was not a fresh full-site HTTP crawl. Public HTTP status/header evidence is dated 35.2; current source/build changes are verified locally. No deployment was performed by this task, and no assertion is made that Google has recrawled the changes.

The existing 35.2 audit was reused with `--out`, `--live-evidence` and `--expect-no-orphans`. Original reports remain intact. Full current matrices are under postfix/. No new audit framework or external search-provider integration.

## Deferred

The 1,037 external-only combined redirect chains remain **P2 URL HYGIENE**, with a future one-hop Cloudflare design documented in [deferred-hygiene.md](deferred-hygiene.md); not implemented. Lastmod remains partially trustworthy and source-based, not artificial. Missing affiliate destinations for Litter-Robot 5 Pro and Neakasa Riko remain unchanged and do not make their pages technically invalid.

## Validation and visual QA

- **861/861 tests pass** after final build: baseline 856 + 3 closure tests + 2 independently merged commerce tests.
- Full production build: **PASS, 375 pages**; canonical/sitemap count remains **260**.
- Existing relevant audit commands: **15/16 pass**. The known strict price audit is the sole failure, for the same two missing destinations.
- Existing browser geometry suite: **30/30 pass** using installed Chrome and the existing metrics/thresholds.
- Changed hub: **8/8 geometry/anchor checks pass**, widths 375, 768, 1024 and 1600, both themes.
- Exactly **four final fullpage screenshots**, visually inspected: 375px Mobile Light/Dark and 1600px Desktop Light/Dark. No screenshot matrix or crops; other breakpoints use measurements only.

- [hub-375-light.png](screenshots/hub-375-light.png)
- [hub-1600-light.png](screenshots/hub-1600-light.png)
- [hub-375-dark.png](screenshots/hub-375-dark.png)
- [hub-1600-dark.png](screenshots/hub-1600-dark.png)

A transient test run overlapped rebuilding dist and reported seven missing-file failures; it is preserved as `validation/tests-during-build.log`. Final tests ran after the completed final build and all pass. The initial missing-link check correctly detected that the hub bypasses Markdown; final HTML/browser/graph assertions validate the actual renderer placement.

## Concurrent workspace changes

During work, an independent price refresh and commit/merge changed the workspace. Commit `0f0d980e` captured in-progress closure files; merge `6afbc57c` added commerce changes. These actions were not performed by this task and were not reverted. Final validation was repeated on that new HEAD plus the final link correction. The closure's own final production delta is only CategoryExperience's hub entry and Neakasa's metadata leak cleanup; `validation/closure-production.patch` isolates it relative to the starting state. The Markdown hub has no net change relative to that starting state.

Consequently, current local-vs-35.2 deployed text differences also reflect concurrent commerce changes. They are not mislabelled as newly observed production SEO regressions. Audit-generated report changes outside this report were archived and restored to the current committed versions. Source hashes are in closure.json.

## Exact decision gate

1. **Is /futterautomat-berater/ still an orphan? NO.** Final build: one contextual hub source, depth 2.
2. **Can internal Lifecycle-Owner/workflow metadata still leak through the identified path? NO.** Bad public inputs removed, internal note outside parsed data, all-product source regression gate and generated-output scan pass. This claim is scoped to the identified path, not arbitrary future prose.
3. **Did the GSC Crawled/Not-Indexed cohort show a common material technical defect? INSUFFICIENT_DATA.** Export missing; cohort not reconstructed.
4. **Is there evidence that canonical, sitemap, robots, rendering, internal-link architecture or schema explains Google's extremely weak sitewide visibility? NO.** Available evidence demonstrates no such mechanism; it does not reveal Google's private indexing decisions.
5. **Are any P0 technical SEO issues left? 0.**
6. **Are any P1 technical SEO issues left? 0.**
7. **Is another general technical SEO work package justified? NO.**

Deferred categories: **P2 = 4, P3 = 3** (finding groups, not affected URLs). Neither harmless wording warnings nor the documented external/maintenance hygiene blocks freezing general technical work.

**TECHNICAL SEO FREEZE RECOMMENDED.**

**The available evidence does not support further general technical SEO engineering as the primary response to Google's weak visibility.**

This recommendation is bounded by available evidence: the actual GSC cohort remains unassessed, not silently declared technically clean. A later supplied export can support its missing descriptive correlation without reopening a general audit; a newly demonstrated material pattern would justify a targeted investigation.

## Exactly one strategic next action

**First-party product testing:** perform one documented hands-on product test with reproducible measurements and original observations. Not implemented in this work package.
