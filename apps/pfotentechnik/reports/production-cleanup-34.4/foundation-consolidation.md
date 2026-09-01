# PfotenTechnik 34.4 — Foundation consolidation

Status: **PASS**  
Scope: Homepage, Product, Comparison, Category, Manufacturer, Guide, secondary hubs, Legal and Utility  
Principle: global Foundation ownership before page-local cleanup

## Outcome

Stable, repeated production concerns now have one canonical owner. Page-level compositions remain separate where their semantics and interaction models differ. No frozen Product, Comparison or Category information architecture was redesigned.

The consolidation establishes:

- one active semantic Light/Dark token contract, with Foundation 33 names retained only as aliases;
- one generic product media resolver for every production experience;
- one canonical `ProductScore` presentation path;
- one compact product-row primitive for Guide and Manufacturer;
- one secondary-disclosure primitive for Guide, Manufacturer and Product details;
- one final production CSS contract for axes, actions, section headers, media fallback, tables and shared responsive behavior;
- Foundation activation on every Product route instead of one historical reference product only.

The Guide's main article remains server rendered, open and directly readable. Only secondary depth uses disclosure.

## Classification

| Concern | Class | Old owners | Canonical owner | Consumers | Duplication removed |
|---|---|---|---|---|---|
| Active Light/Dark colors and surfaces | A — identical semantics | Active `--pt-color-*` palette plus an independent `--pt33-*` palette | `pfotentechnik-design-tokens.css` semantic `--pt-color-*` contract | All public experiences; 33.x components through aliases | Independent 33.x production palette and duplicate automatic-dark branch removed; explicit `/foundation/` preview modes remain the documented exception |
| Foundation route activation | A — identical semantics | `ProjectLayout` default plus Product's one-slug opt-in | `ProjectLayout` with Product explicitly participating | All Product routes and all other public experiences | Product-only reference exception removed |
| Product media resolution | A — identical semantics | Generic resolver stored under `domain/comparison`, imported by seven domains | `src/domain/mediaResolver.mjs` | Homepage, Product, Comparison, Category, Manufacturer, Guide, Product alternatives | Comparison-owned file deleted; all imports point to the domain-level owner |
| Product score rendering | A — identical semantics | Direct `ProductScore` use plus Category's `EditorialScore` wrapper | `@affiliate-core/components/ProductScore.astro` | Product, Comparison, Category and shared compact product rows | Category wrapper path removed; Guide/Manufacturer inherit the same score UI through `FoundationProductMini` |
| Compact contextual product row | A — identical semantics | Separate Guide and Manufacturer media/copy/score/action markup and CSS | `FoundationProductMini.astro` plus `.pt-product-mini*` contract | Guide and Manufacturer | Duplicate row markup, mobile geometry, media fallback and score placement removed |
| Secondary detail disclosure | A — identical semantics | Guide depth, Manufacturer depth and Product specs/FAQ details | `FoundationDisclosure.astro` plus `.pt-disclosure*` contract | Guide, Manufacturer, Product details/FAQ | Repeated summary marker, chevron, spacing, border and mobile rules removed |
| Buttons and action aliases | A/B — shared structure with compatible variants | `components/buttons.css`, `pfotentechnik.css`, primitives and UI-system base patches | `pfotentechnik-foundation-contracts.css` | Shared CTAs, navigation advice, Product actions and Utility aliases | Obsolete button file/import deleted; repeated base/variant rules removed from three legacy layers |
| Reading and decision axes | A — identical semantics | Legal local max-width and Guide local wrapper widths | `.pt-reading-axis` and `.pt-decision-axis` | Legal and Guide; available to other reading/decision surfaces | Legal width ownership and duplicated wrapper setup removed |
| Section headers and eyebrow hierarchy | A — identical semantics | Guide and Manufacturer copies | `.pt-section-header` and existing `.pt-eyebrow` | Guide and Manufacturer | Duplicate heading, eyebrow and introductory-copy rules removed |
| Long-form tables | B — compatible with small variants | Guide local overflow rules and generic article tables | `.pt-reading-prose` table contract; `.pt-table` for explicit data tables | Guide, Legal and future reading surfaces | Local Guide table overflow patch removed |
| Media and empty fallback | B — compatible with small variants | Page-specific fallback boxes | `.pt-media`, `.pt-media-fallback`, `.pt-empty-state` | Shared compact product rows and compatible empty states | Shared geometry and semantic surfaces centralized; experience-specific hero fallbacks remain local |
| Focus, reduced motion and touch targets | B — compatible with small variants | Multiple local focus/mobile rules plus existing resilience utilities | Foundation contract plus `pfotentechnik-responsive-resilience.css` | Shared actions and disclosures across page types | Guide/Manufacturer local focus and compact-row mobile patches removed |
| Global gutters and overflow resilience | B — already canonical | `pfotentechnik-responsive-resilience.css` | All public page types | Kept; no second abstraction introduced |
| Breadcrumbs and shell | C — valid distinct composition around a shared shell | Core layout/header/footer and route-level breadcrumb data | Existing core shell | All public routes | Kept; route semantics differ and no duplicate renderer was proven |
| Product, Comparison and Category heroes | C — superficially similar | Their frozen experience components | Existing experience owners | Respective page types | Kept; decision hierarchy and responsive behavior differ |
| Comparison explorer/details | C — valid distinct interaction | Comparison production component | Comparison production component | Comparison | Kept; finalist selection is not a generic disclosure |
| Manufacturer family navigation | C — valid distinct interaction | Manufacturer experience | Manufacturer experience | Manufacturer | Kept; portfolio navigation is not a generic secondary text disclosure |
| Evidence, methodology and suitability panels | C — valid distinct composition | Product/Comparison/Manufacturer editorial modules | Existing experience owners | Their respective page types | Kept; evidence semantics and density differ |
| Advisor forms and result flow | C — valid distinct interaction | `PetAdvisor.astro` | Advisor component, consuming Foundation tokens/actions | Utility | Kept; field state and result behavior do not justify a generic form system in this pass |
| Old comparison resolver and button layer | D — obsolete after migration | `domain/comparison/mediaResolver.mjs`, `styles/components/buttons.css` | Replaced by owners above | None | Files deleted and imports removed |

## Canonical ownership map

| Contract | Owner |
|---|---|
| Color, surface, border, shadow and compatibility aliases | `src/styles/pfotentechnik-design-tokens.css` |
| Production axes, actions, compact rows, disclosures, shared tables and fallback surfaces | `src/styles/pfotentechnik-foundation-contracts.css` |
| Product media selection | `src/domain/mediaResolver.mjs` |
| Product score UI | `packages/affiliate-core/src/components/ProductScore.astro` |
| Compact contextual product UI | `src/components/foundation/FoundationProductMini.astro` |
| Secondary disclosure UI | `src/components/foundation/FoundationDisclosure.astro` |
| Global overflow/gutter resilience | `src/styles/pfotentechnik-responsive-resilience.css` |
| Public shell | `src/layouts/ProjectLayout.astro` and affiliate-core layout/header/footer |

## Page-type audit

| Page type | Foundation result | Consolidation action |
|---|---|---|
| Homepage | Aligned | Media resolver import moved to canonical owner; composition kept |
| Product | Aligned | All routes now receive Foundation marker; canonical media/score/disclosure paths retained or adopted |
| Comparison | Aligned | Media resolver import moved; finalist/explorer composition kept |
| Category 34.2 | Frozen and aligned | Canonical `ProductScore` adopted; no redesign |
| Manufacturer 34.3 | Aligned | Shared compact products, disclosure and section header adopted |
| Guide 34.3 | Aligned | Shared compact products, disclosure, reading/table primitives adopted; primary article remains open |
| Secondary hubs | Aligned | Existing Foundation/token migration retained; no hub redesign |
| Legal | Aligned | Reading axis, eyebrow and reading-prose contracts adopted |
| Utility | Aligned | Shared token/action contract verified; functional composition kept |

## Guide invariant

The representative Guide passed all four rendered modes:

- primary `#guide-main article` visible without interaction;
- article not nested in `<details>`;
- no “Vollständigen Ratgeber öffnen” gate;
- no internal editorial-policy language;
- server-rendered first article heading present;
- secondary depth may still use `FoundationDisclosure`.

## Verification

| Check | Result |
|---|---|
| Foundation/34.3/34.4/media/CSS/Dark Mode regression set | **81/81 pass** |
| Updated active Dark Mode contract tests | **Pass** |
| Astro production build | **Pass — 367 pages** |
| Representative browser audit | **Pass — 9 page types × 4 modes = 36 checks, 0 findings** |
| Browser widths/themes | 375 Light, 375 Dark, 1600 Light, 1600 Dark |
| Browser checks | Foundation marker, shared shell, one H1, horizontal overflow, semantic page background, broken media, white surfaces in Dark, Guide openness/policy copy |
| Source hygiene | `git diff --check` pass; no literal UI colors in new Foundation contract/components |

Rendered evidence: [`browser-audit.json`](./browser-audit.json)

An additional non-gating legacy CSS suite exposed three stale Comparison CSS architecture assertions. They concern the unchanged comparison token file/import shape and are not caused by this consolidation; the production Comparison route passes the build and all four rendered checks. They should be reconciled with the current Comparison architecture in its own cleanup pass rather than restoring an obsolete eight-token subsystem here.

## Final status

**PFOTENTECHNIK FOUNDATION CONSOLIDATION 34.4: PASS**

- Shared semantic ownership: consolidated
- Obsolete duplicate owners: removed
- Frozen page compositions: preserved
- Light Mode: pass
- Dark Mode: pass
- Responsive production routes: pass
- Primary Guide body: open and protected
