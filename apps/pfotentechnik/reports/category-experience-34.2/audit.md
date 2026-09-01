# Category / Hub Experience 34.2 — production audit

Date: 2026-09-01  
Scope: category/hub routes only  
Representative routes: `/smarte-futterautomaten/`, `/trinkbrunnen/`, `/gps-tracker/`, `/katzenklappen/`, `/haustierkameras/`, `/automatische-katzentoiletten/`

## Executive finding

All six commercial hubs are ordinary entries in `src/content/pages` and are rendered by the generic `src/pages/[slug].astro` long-form article route. There is no category ViewModel or category renderer. The content is often strong, but the production composition treats orientation, product discovery, decision aids, prose, auto-linking, conversion modules, journey modules, FAQ and related content as peers. The result is an article/card/catalog hybrid rather than a requirement-first decision hub.

The clearest case is `/smarte-futterautomaten/`: the frozen pre-34.2 build contains approximately 1,401 DOM elements, 54k main-content text characters and 80 unique main-content route links. All 37 feeder product pages are exposed in the main journey. The existing performance audit reports 133,311 HTML bytes, 1,445 measured DOM nodes and 3,499,826 image bytes; this route accounts for the existing category-related HTML, DOM and image budget failures.

## Current production architecture

| Concern | Current source / behavior | Audit decision |
|---|---|---|
| Shared route | `src/pages/[slug].astro` renders every page entry | REFINE: keep route generation and add one systemic category branch |
| Content source | Markdown body plus page frontmatter in `src/content/pages/*.md` | KEEP: current text, metadata, links, FAQ and media remain source material |
| Generic assembly | `assembleContentPage()` derives article intent blocks, recommendation and closing CTA | MOVE: continue for guides; category decisions move to a dedicated ViewModel |
| Product source | `getProducts()` registry plus `comparisonProducts`, `contentPlatform.products` and premium `products` filters | REFINE: resolve broad category data, then expose only a curated 3–6 item set |
| Current product selection | Some hubs configure 5–9 products; others render a category filter of up to six; feeder prose links every product | REPLACE: one deterministic selection policy with existing editorial order and structured product data |
| Comparison source | `getComparisons()` exists, but hubs mainly hard-code comparison links in premium cards/body | REFINE: validate configured high-value comparison routes against the comparison registry |
| Guide source | Generic `getRelatedContent()` plus body links and `DecisionJourney` | REPLACE: small, category-relevant guide config validated against the page registry |
| Related/internal links | `AutoLinkContent`, `DecisionJourney`, `ConversionJourney`, `RelatedArticles` and hand-authored body links all add routes | MERGE: explicit decision paths, comparisons, guides and a compact supporting-content disclosure become the category graph |
| Media | Page hero when configured, otherwise a generic category fallback; product modules access images directly | REFINE: preserve real page hero; otherwise use the generic product media resolver for a representative product; compact fallback only |
| SEO | Existing title, description, canonical, H1, indexability and Article/Breadcrumb/FAQ schema flow through `ProjectLayout` | KEEP: no metadata or schema contract change |
| Light/Dark | Global Foundation plus generic article/premium styles; generic decision cards still include a hard-coded white surface | REPLACE on category branch: use Foundation semantic surfaces only |
| Category overrides | No six hand-built pages; differences live in content/frontmatter | KEEP principle; introduce one small editorial category config, no product-specific template branches |

## Current shared section chain

The generic route currently renders this potential sequence:

1. Breadcrumbs
2. Article header, description and article metadata
3. Full-width hero
4. Article / table of contents
5. Auto content blocks and editorial evidence
6. Buying-intent direct entry
7. Premium renderer (answer, quick facts, scenarios, decision, checks, mistakes, products)
8. Generic product recommendation modules
9. Decision rule summaries, fit, checklist, mistakes, alternatives and tree
10. Full Markdown body
11. Decision journey
12. Generic next steps and sources
13. Health bridge, money CTA and FAQ
14. Generic conversion journey
15. Related articles

This chain is not consistently present on every hub, but its optional modules produce category-specific accidental composition rather than a deliberate shared journey.

## Representative route map and disposition

| Category | Current material / section pattern | KEEP | REFINE / MOVE / MERGE | REPLACE / REMOVE |
|---|---|---|---|---|
| Futterautomaten | Hero; 4 quick-fact paths; 4 scenarios; five-question decision list; mistakes; six configured products; exceptionally long body covering types, reliability, power/network failure, portions, household scenarios, cleaning, privacy, manufacturers, comparisons and all products | Hero; decision consequences; failure-mode, portion, hygiene and multi-pet evidence; FAQ; strategic comparison/guide/manufacturer links | Requirements become six consequence rows; best scenarios become 4–6 paths; strongest comparisons/products/guides move before supporting prose; long technical evidence moves to server-rendered disclosure | All-product directory, duplicate intros, repeated comparison directories and generic recommendation/conversion fragments |
| Trinkbrunnen | No real hero; answer; four quick facts; five decisions; eight checks; four mistakes; product filter up to six; concise body on drinking surface, cleaning, power, material, filter, noise and capacity | Drinking-surface, cleaning, material, operating mode and recurring-cost logic; two comparisons; cleaning/material/filter guides; FAQ | Resolve hero from curated product media; merge checks and body criteria into six requirement rows; keep 3–5 selected products | Generic database product block and repeated model-entry copy |
| GPS-Tracker | Real hero; answer; four comparison cards; Mobilfunk/VHF decision; six checks; mistakes; nine configured products; body on system types, animal fit, range, battery, cost, privacy and escape response | Hero; system-chain explanation; animal/weight, coverage, attachment, battery, live tracking, subscription and privacy evidence; major comparisons/guides/manufacturers | Turn comparison cards into decision paths and selected comparisons; curate products from existing editorial list; supporting technical copy moves after products/guides | Flat manufacturer/model directory and duplicate tracker lists |
| Katzenklappen | Generic hero fallback; answer; three path cards; nine configured products; body on access roles, tailgating, measurements, per-pet rights, offline/app split, installation and household fit | Access-control, measurements, installation, insulation, multi-cat rights and tailgating limits; two comparisons and installation/acclimation guides | Use generic product media; convert five-step decision content to requirement rows; curate products to distinct roles | Nine-product list and repeated product-role/product-page directories |
| Haustierkameras | Generic hero fallback; answer; four model/class cards; five configured products; body on camera class, viewing angle, interaction, cloud/storage, outages, 24-month cost and privacy | Viewing coverage, local/cloud behavior, account/fees, privacy, interaction and outage boundaries; principal comparison; five supported products | Use generic media; make problem paths and comparison prominent; use existing recommendation/evidence text for product reasons | Model-first opening and repeated product page list |
| Automatische Katzentoiletten | Generic hero fallback; no premium decision blocks; nine configured products; concise body on mechanism, open/closed, dimensions, minimum weight/safety, litter, maintenance, monitoring and cost | Entry/size, safety, litter compatibility, maintenance, multi-cat use, privacy/cost evidence; main comparison | Add the missing requirement-first layer through category config; resolve generic media; curate 3–5 products; keep body as supporting evidence | Immediate comparison/product-directory feel and nine-product list |

## Category-specific decision inventory

| Category | Top buying decisions | Failure / compromise themes | Comparison entry points | Supporting guides |
|---|---|---|---|---|
| Futterautomaten | Futterart; animal/size; number of animals/access; portion repeatability; offline/power behavior; cleaning | Wet food in dry hopper; false precision; food theft; cloud dependence; blockage; hygiene | Cats; dogs; wet food; multiple cats; offline | Selection basics; cleaning; power outage; holiday use; portion sizing |
| Trinkbrunnen | Animal/drinking surface; noise; cleaning path; material; filters/recurring costs; mains/battery | Large tank mistaken for hygiene; inaccessible pumps; UVC/app overvalued; low-water noise; filter dependence | Cats; dogs | Cleaning; material; filter change; habituation; continuous operation |
| GPS-Tracker | Dog/cat fit; weight/attachment; mobile coverage/transmission; battery conditions; live tracking; subscription | GPS vs Bluetooth confusion; quoted battery maxima; dead zones; collar safety; subscription cost; privacy | Dogs; cats; small cat trackers; no subscription; long battery | How GPS works; accuracy; subscription; attachment; privacy |
| Katzenklappen | Access type; animal/opening dimensions; per-animal rights; installation material; offline/app operation; insulation | Tailgating; wrong cut-out; app mistaken for local access control; weak insulation; prey detection limits | Microchip flaps; app and prey detection | Installation; acclimation; multi-cat households; draught/insulation |
| Haustierkameras | Observation task; viewing geometry; local/cloud storage; required account/subscription; interaction; 24-month cost/privacy | Blind spots; local storage mistaken for local operation; cloud outages; false separation claims; treat features as care | Best pet cameras | Smart-pet overview and existing product evidence; no unrelated guide links invented |
| Automatic litter boxes | Cat weight/entry; open/closed geometry; safety principle; litter compatibility; cleaning/maintenance; multi-cat/privacy/cost | Kitten/minimum-weight risk; enclosure avoidance; incompatible litter; sensor contamination; proprietary consumables; monitoring overclaim | Best automatic litter boxes | Existing hub evidence and comparison; no unrelated guide links invented |

## Existing SEO and internal-link baseline

The frozen build establishes the before values below. Counts refer to unique internal route links in `<main>`, including breadcrumb links and current dynamic modules.

| Route | Title/H1/canonical | Schema | Main links | HTML bytes | Approx. DOM | Main SSR text chars |
|---|---|---:|---:|---:|---:|---:|
| `/smarte-futterautomaten/` | present / present / correct | Organization, Article, BreadcrumbList, FAQPage | 80 | 133,311 | 1,401 | 53,990 |
| `/trinkbrunnen/` | present / present / correct | Organization, Article, BreadcrumbList, FAQPage | 21 | 73,155 | 718 | 16,515 |
| `/gps-tracker/` | present / present / correct | Organization, Article, BreadcrumbList, FAQPage | 33 | 72,018 | 706 | 17,040 |
| `/katzenklappen/` | present / present / correct | Organization, Article, BreadcrumbList, FAQPage | 22 | 54,689 | 560 | 11,046 |
| `/haustierkameras/` | present / present / correct | Organization, Article, BreadcrumbList, FAQPage | 16 | 56,375 | 540 | 11,964 |
| `/automatische-katzentoiletten/` | present / present / correct | Organization, Article, BreadcrumbList | 18 | 47,867 | 447 | 8,765 |

The 34.0 baseline lists nine indexable destinations without incoming main-content links. Natural category candidates are:

- Trinkbrunnen: `/katze-an-trinkbrunnen-gewoehnen/`, `/katzentrinkbrunnen-dauerbetrieb-urlaub/`, `/katzentrinkbrunnen-ohne-filter/`, `/trinkbrunnen-fuer-kitten-sicher/`, `/produkt/feelneedy-fn-w18-8l-katzenbrunnen/`
- Other baseline orphans are health/general topics without a sufficiently direct fit for these six purchase hubs and must not be forced into the category journey.

The current GSC sample is too small to justify automatic selection. The only reliable category signal is that `/smarte-futterautomaten/` is an observed opportunity (3 impressions, average position 5.3). Selection therefore follows existing information architecture and supported content, with GSC used only as a conservative secondary signal.

## Content safety classification

- **A — useful decision content:** category-specific criteria, consequence statements, failure modes, setup/maintenance constraints, decision matrices, supported comparison/guide links. Keep prominently or compress into the ViewModel.
- **B — generic / low-value SEO material:** duplicated definitions, repeated introductions and undifferentiated model/manufacturer directories. Remove from the primary journey; do not retain merely for length.
- **C — supporting evidence:** technical explanations, detailed criteria, troubleshooting, methodology, manufacturer context and longer practical sections. Keep server-rendered in a native disclosure after the primary journey.
- **D — duplicated:** premium blocks repeated by body headings, full product lists repeated by content-discovery markers, repeated comparison directories and generic journey/related modules. Render only one intentional instance.

## Migration decision

Build one category ViewModel and one category renderer. Category identity and editorial decision logic live in a small six-entry config; product facts remain in product content, comparison metadata remains in comparison content, guide metadata remains in page content, media goes through the shared product media resolver, and scores use the canonical shared `EditorialScore` component. The generic long-form route remains unchanged for non-category pages.

Target journey:

1. Category orientation hero
2. “Was muss zu deinem Alltag passen?” requirement rows
3. 3–6 curated decision paths
4. 1–4 important comparisons
5. 3–6 selected product decision rows
6. 3–5 supporting guides when real category coverage exists
7. Supporting evidence / trust and optional server-rendered long-form disclosure
8. One clear next step

The audit map is complete. Production implementation may begin.
