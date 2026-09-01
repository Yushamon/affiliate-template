# PfotenTechnik Visual Legacy Audit 34.3a — Route Inventory

Audit date: 2026-09-01

## Scope and method

The inventory was derived from the rendered role of every public Astro route, not only its source folder or content collection. Product, comparison-detail, homepage, Guide/Manufacturer detail and CategoryExperience routes remain under their frozen experience systems. CategoryExperience hubs are listed as controls; the other 14 records are the remaining public utility, legal, functional, methodology and hub surfaces in scope for 34.3a.

Every listed route was checked at 375 px and 1600 px in Light and Dark. The browser audit verifies the shared shell, Foundation markers and page background, one H1, horizontal overflow, broken media, focus visibility, white surfaces in Dark, pre-Graphite surfaces and the legal Reading Axis.

## Hub / cluster coverage

### A — CategoryExperience 34.2 hubs: 6

These are frozen controls. All six passed Foundation, Light and Dark verification; none was redesigned.

- `/smarte-futterautomaten/`
- `/trinkbrunnen/`
- `/gps-tracker/`
- `/katzenklappen/`
- `/haustierkameras/`
- `/automatische-katzentoiletten/`

### B — Other hub / cluster pages: 5

- `/vergleiche/`
- `/hersteller/`
- `/wissen/`
- `/kaufberatung/`
- `/smarte-haustiertechnik/`

`/wissen/` was a **LEGACY HUB EXPERIENCE** at audit start: its old teal, white card and shadow composition survived outside the current semantic surface system. It received a small token migration without changing its information architecture. The other four B-pages were either already aligned or needed only local surface cleanup.

`/smarte-gadgets-fuer-hunde-und-katzen/` carries hub-like registry metadata, but its actual rendered role is a normal editorial GuideExperience article. It is therefore covered by the frozen Guide system rather than counted as a hub. The homepage is likewise not counted as a topical hub.

| Hub classification | Count |
| --- | ---: |
| CategoryExperience 34.2 hubs | 6 |
| Other hub / cluster pages | 5 |
| Aligned other hubs | 5 |
| Legacy other hubs | 0 |

## Route inventory

Legend: `No (cleared)` means the route contained a legacy issue at audit start and no longer does after the scoped fix.

| Route | Page type | Current shell | Current Foundation usage | Light status | Dark status | Legacy colors | Legacy surfaces | Legacy typography | Legacy width / spacing | Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/smarte-futterautomaten/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/trinkbrunnen/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/gps-tracker/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/katzenklappen/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/haustierkameras/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/automatische-katzentoiletten/` | Category hub, A-control | ProjectLayout + CategoryExperience 34.2 | Direct semantic tokens | Pass | Pass | No | No | No | No | KEEP — FROZEN CONTROL |
| `/vergleiche/` | Comparison navigation hub, B | ProjectLayout + comparison overview | Semantic Foundation | Pass | Pass | No | No | No | No | KEEP — frozen major shell |
| `/hersteller/` | Manufacturer portfolio hub, B | ProjectLayout + manufacturer hub | Semantic Foundation after local cleanup | Pass | Pass | No (cleared) | No (cleared) | No | No | ALIGN |
| `/wissen/` | Knowledge / authority hub, B | ProjectLayout + knowledge hub | Semantic Foundation after migration | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/kaufberatung/` | Advice navigation hub, B | ProjectLayout + advice hub | Semantic Foundation | Pass | Pass | No | No | No | No | KEEP |
| `/smarte-haustiertechnik/` | Topical authority hub rendered by GuideExperience, B | ProjectLayout + GuideExperience 34.3 | Semantic Foundation | Pass | Pass | No | No | No | No | KEEP |
| `/impressum/` | Legal | ProjectLayout + LegalPageLayout | Foundation Reading Axis | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/datenschutz/` | Legal | ProjectLayout + LegalPageLayout | Foundation Reading Axis | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/affiliate-hinweis/` | Legal disclosure | ProjectLayout + LegalPageLayout | Foundation Reading Axis | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/kontakt/` | Utility / contact | ProjectLayout + LegalPageLayout | Foundation Reading Axis | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/redaktion/` | Editorial transparency | ProjectLayout + LegalPageLayout | Foundation Reading Axis | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/so-bewerten-wir/` | Methodology / transparency | ProjectLayout + GuideExperience 34.3 | Semantic Foundation | Pass | Pass | No | No | No | No | KEEP |
| `/futterautomat-berater/` | Functional advisor | ProjectLayout + PetAdvisor | Semantic Foundation after migration | Pass | Pass | No (cleared) | No (cleared) | No | No (cleared) | MIGRATE SMALL |
| `/berater/futterautomat/` | Functional advisor | ProjectLayout + FeederAdvisor | Semantic Foundation after migration | Pass | Pass | No (cleared) | No (cleared) | No | No | MIGRATE SMALL |
| `/foundation/` | Noindex public utility / token preview | ProjectLayout + Foundation preview | Direct Foundation samples | Pass | Pass | No | No | No | No | KEEP |

## Absent or excluded route types

| Route type | Result | Audit disposition |
| --- | --- | --- |
| Search UI | No public search route exists | No rendered legacy surface; no change |
| Custom 404 | No maintained Astro 404 route exists | Hosting fallback is outside the app surface; DEFER any custom 404 work to a separately scoped task |
| Author pages | No public author route exists | No rendered legacy surface; no change |
| Standalone sources page | No public standalone route exists | Sources/evidence remain embedded in Guide and Manufacturer experiences |
| Other static information pages | No additional dedicated public page files found | Dynamic editorial pages are covered by the frozen Guide system |
| `/admin/seo/**` | Internal administration UI | Excluded from public-production route inventory |
| `/api/**`, `/rss.xml` | Machine endpoints | Excluded because they do not render public page UI |

No URL, canonical, indexability, legal wording, title/meta, schema or internal-link destination was changed by this audit.
