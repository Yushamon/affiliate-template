# PfotenTechnik 33.3 final migration report

The validated 33.x foundation is now the production default. Product routes
use the shared decision-first renderer; comparison routes use the promoted
automatic comparison renderer. Automatic selection preserves finalists,
relevant alternatives and Explorer breadth without manual shortlist
maintenance. Media, price, score, fit, evidence and links remain data-driven.

The build produced 367 pages. The 33.3 focused gate is green: 29/29 tests,
generic media tests 3/3, cross-category finalist coverage, fresh responsive
captures, design-system checks, contrast/responsive audits and
`git diff --check` all pass. The product audit reports 0 critical entries;
optional missing lanes are handled by generic fallbacks. URLs, canonicals,
structured data, internal links and affiliate fields were not intentionally
changed.
