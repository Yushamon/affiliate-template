# PFOTENTECHNIK — VISUAL LEGACY SURFACE AUDIT 34.3a

Audit date: 2026-09-01

## Outcome

All remaining rendered public utility, legal, methodology, functional and hub surfaces are aligned with the 33.x Foundation in Light and Dark. CategoryExperience 34.2 controls remain frozen and pass verification. The only page initially qualifying as a **LEGACY HUB EXPERIENCE**, `/wissen/`, was migrated at token level without redesign.

The automated result is **PASS**: 20 route records, four states per route, 80 checks, zero findings and exactly 12 representative full-page screenshots.

## Final route status

| Route | Page type | Legacy visual issue | Fix required | Fix applied | Light | Dark | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/smarte-futterautomaten/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/trinkbrunnen/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/gps-tracker/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/katzenklappen/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/haustierkameras/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/automatische-katzentoiletten/` | Category hub control | None | No | Frozen verification only | Pass | Pass | ALIGNED / FROZEN |
| `/vergleiche/` | Comparison hub | None | No | None | Pass | Pass | ALIGNED |
| `/hersteller/` | Manufacturer hub | Pre-Graphite route-specific Dark surface rules | Yes | Semantic surface/border/image-stage tokens | Pass | Pass | ALIGNED |
| `/wissen/` | Knowledge hub | LEGACY HUB EXPERIENCE: teal/white card composition | Yes | Page-specific colors, borders and shadows migrated to Foundation | Pass | Pass | ALIGNED |
| `/kaufberatung/` | Advice hub | None | No | None | Pass | Pass | ALIGNED |
| `/smarte-haustiertechnik/` | Topical authority hub | None | No | None | Pass | Pass | ALIGNED |
| `/impressum/` | Legal | Legacy white article-card shell | Yes | Foundation LegalPageLayout / Reading Axis | Pass | Pass | ALIGNED |
| `/datenschutz/` | Legal | Legacy shell plus long-H1 mobile overflow | Yes | LegalPageLayout and safe heading wrapping | Pass | Pass | ALIGNED |
| `/affiliate-hinweis/` | Legal disclosure | Legacy white article-card shell | Yes | Foundation LegalPageLayout / Reading Axis | Pass | Pass | ALIGNED |
| `/kontakt/` | Utility / contact | Legacy white article-card shell | Yes | Foundation LegalPageLayout / Reading Axis | Pass | Pass | ALIGNED |
| `/redaktion/` | Editorial transparency | Legacy white article-card shell | Yes | Foundation LegalPageLayout / Reading Axis | Pass | Pass | ALIGNED |
| `/so-bewerten-wir/` | Methodology | None | No | None | Pass | Pass | ALIGNED |
| `/futterautomat-berater/` | Functional advisor | Hard-coded cards/colors and mobile sticky-action overlap | Yes | Semantic token migration; non-overlapping mobile actions | Pass | Pass | ALIGNED |
| `/berater/futterautomat/` | Functional advisor | Hard-coded Light/Dark UI branches | Yes | Unified semantic Foundation layer and focus | Pass | Pass | ALIGNED |
| `/foundation/` | Noindex utility | None; explicit dual-theme samples are intentional | No | None | Pass | Pass | ALIGNED |

## Totals

The primary totals exclude the six frozen CategoryExperience control routes; the browser matrix includes them as verification controls.

| Classification | Count |
| --- | ---: |
| TOTAL remaining public routes | 14 |
| Already aligned | 5 |
| Needed small alignment | 9 |
| Still legacy | 0 |
| Blocked | 0 |
| Browser-audited route records including frozen controls | 20 |

Hub coverage:

| Classification | Count |
| --- | ---: |
| CategoryExperience 34.2 hubs | 6 |
| Other hub / cluster pages | 5 |
| Aligned other hubs | 5 |
| Legacy other hubs | 0 |

## Guide Experience correction included in 34.3

The primary Guide article now renders open and directly readable in the server response on mobile, tablet and desktop. It is a normal section/article, not a closed `details`, accordion or “read more” gate. The journey is orientation → decision summary → table of contents → full article → contextual products → FAQ/evidence → next step.

Internal renderer/editorial-policy language was removed. Product modules now use the reader-facing heading “Passende Modelle für diesen Entscheidungsfall”, while each card carries the actual relevance rationale with “Interessant, wenn …”. The 375 px Light/Dark guide screenshots visibly enter the article after the early decision content.

Regression coverage explicitly asserts:

1. the primary body is visible without interaction;
2. it is not inside closed `details`;
3. no “Vollständigen Ratgeber öffnen” gate exists;
4. no internal policy eyebrow is rendered;
5. recommendation copy is reader-oriented;
6. server-rendered article content remains present;
7. heading hierarchy remains valid.

## Verification evidence

- Production build: 367 pages, pass.
- Focused Foundation 33 + Manufacturer/Guide 34.3 contracts: 11/11 pass.
- 34.3a browser audit: 20 routes × 4 states = 80/80 pass, zero findings.
- Viewports/themes: 375 Light, 375 Dark, 1600 Light, 1600 Dark.
- Representative full-page screenshots: Impressum, Redaktion, Futterautomat-Berater; 12 total.
- Computed checks: Foundation page background, semantic body color, shared header/footer, legal Reading Axis, focus, overflow, Dark white surfaces, pre-Graphite surfaces and broken media.
- Manual screenshot review caught and cleared the mobile advisor action overlap.
- SEO safety: no route, canonical, indexability, legal wording, title/meta, schema or internal-link destination change.
- Strict internal-link target audit: 367 pages, zero errors and zero warnings.

Two historical 25.8 token-shape tests remain stale: they expect the retired `:root:not([data-theme="light"])` selector and an older status-token hex. The current explicit Light/Dark state machine, focused Foundation contracts and computed browser matrix pass. Those obsolete test expectations are deferred to 34.4 contract consolidation; they do not represent a rendered route defect.

## Release status

PFOTENTECHNIK VISUAL LEGACY AUDIT 34.3a

UTILITY / LEGAL ALIGNMENT: PASS  
LEGACY COLOR SURFACES: CLEARED  
LIGHT MODE: PASS  
DARK MODE: PASS  
PUBLIC PAGE CONSISTENCY: PASS

READY FOR PRODUCTION CONSOLIDATION 34.4
