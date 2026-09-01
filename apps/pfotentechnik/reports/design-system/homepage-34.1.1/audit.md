# PfotenTechnik Homepage Experience 34.1.1

Status: PASS

## Visual changes

- Preserved the hero, four-decision composition, difference chapter, and final green CTA.
- Reframed problem discovery as one cohesive interactive system with stronger row hierarchy, icons, separators, hover/focus behavior, and denser mobile rows.
- Kept the first mobile decision featured and compressed the remaining decisions into editorial media/text rows.
- Reworked direct category access into two-column desktop rails and compact mobile rows using the existing category title, cue, count, and URL.
- Gave the physical technology chapter an explicit editorial purpose using the selected product's existing use case, decision constraint, category, and generic product-media resolution.
- Converted mobile guides into compact image-led rows while retaining all three destinations.
- Restored the missing transparency copy from project configuration and reduced the trust chapter to a compact strip.
- Reduced supporting-heading scale and lower-page spacing without changing global typography or color tokens.

## Section order

1. Hero
2. Problem discovery
3. Four decisions
4. PfotenTechnik difference
5. Direct categories
6. Physical technology moment
7. Guides
8. Transparency
9. Closing CTA

## Mobile height

| Theme | 34.1 before | 34.1.1 after | Delta |
| --- | ---: | ---: | ---: |
| Light | 10,426 px | 7,883 px | -2,543 px (-24.4%) |
| Dark | 10,426 px | 7,883 px | -2,543 px (-24.4%) |

## Internal links

- Before: 68 internal-link occurrences, 24 unique destinations.
- After: 69 internal-link occurrences, 24 unique destinations.
- Delta: +1 occurrence for the contextual category link in the technology example; no destination was removed.
- Strict internal-link audit: 0 errors, 0 strict-critical findings.

## Performance

Homepage route, before → after:

- HTML: 40,825 B → 42,082 B (+1,257 B)
- Brotli HTML: 8,136 B → 8,233 B (+97 B)
- DOM nodes: 442 → 459 (+17)
- CSS: 297,622 B → 301,232 B (+3,610 B)
- JavaScript: 0 B → 0 B
- Image bytes: 380,262 B → 380,262 B
- Homepage performance findings: 0 → 0

The repository-wide strict performance command still reports the same five pre-existing errors and four warnings as the checked-in baseline, all on frozen comparison, product, and article routes. No homepage finding or new media/JavaScript cost was introduced.

## Browser and visual QA

- 18/18 viewport/theme cases passed: 320, 375, 430, 768, 820, 1024, 1280, 1440, and 1600 in Light and Dark.
- Checked horizontal overflow, section order, heading bounds, 44 px interactive targets, focus outline, and image validity.
- Exactly four production-build full-page screenshots were generated and opened:
  - `final/homepage-375-light-full.png`
  - `final/homepage-375-dark-full.png`
  - `final/homepage-1600-light-full.png`
  - `final/homepage-1600-dark-full.png`

## Validation

- Production build: PASS, 367 pages.
- Scoped homepage/foundation/media/link/performance tests: PASS, 55/55.
- Design-system check: PASS.
- Responsive audit and viewport contract: PASS.
- Contrast audit: PASS, 28/28 semantic combinations.
- Visual QA strict: PASS, 0 severe risks.
- Technical SEO and schema audit: PASS.
- Release build-output audit strict: PASS.
- Image-alt audit strict: PASS, 0 blocking findings.
- Editorial transparency audit: PASS.
- `git diff --check`: PASS.

One legacy header test remains stale outside this change: it asserts the former 48rem breakpoint while the unchanged 32.2.1 header uses 64rem. The current responsive audit and 18-case homepage browser gate pass.

## Visual self-critique

1. Materially better than 34.1: yes; the lower half is more deliberate and mobile is substantially denser.
2. Problem discovery stronger: yes; it reads as the primary discovery system rather than loose links.
3. Direct category access still too weak: no; the rails now have clear category, cue, evidence count, and direction.
4. Technology purpose obvious: yes; task, practical constraint, product check, and category path are explicit.
5. Trust still oversized: no; it is now a compact closing trust strip.
6. Mobile materially shorter: yes, 24.4% shorter.
7. Mobile still stacked desktop: no; decisions and guides use mobile-specific compositions.
8. Desktop editorial composition retained: yes.
9. Upper half still strongest: yes, intentionally.
10. Lower half maintains enough energy: yes; category rails lead into a stronger physical product moment, then taper through guides and trust.
11. Light as intentional as Dark: yes.
12. Obvious affiliate-template visual remaining: no.

## Final gate

PFOTENTECHNIK HOMEPAGE EXPERIENCE 34.1.1  
EDITORIAL REFINEMENT: PASS  
DISCOVERY EMPHASIS: PASS  
MOBILE DENSITY: PASS  
SEO SAFETY: PASS  
PERFORMANCE: PASS  
LIGHT MODE: PASS  
DARK MODE: PASS  
RESPONSIVE: PASS

HOMEPAGE EXPERIENCE: FINAL FROZEN  
READY FOR CATEGORY/HUB EXPERIENCE 34.2
